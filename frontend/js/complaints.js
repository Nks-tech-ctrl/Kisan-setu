/**
 * KisanSetu — Multi-Level Complaint & Grievance Escalation Engine
 * 
 * Hierarchy:
 * LEVEL 1: FARMER -> OPERATOR
 * LEVEL 2: OPERATOR -> DISTRICT ADMIN
 * LEVEL 3: DISTRICT ADMIN -> SUPER ADMIN (Final)
 * 
 * Strict Isolation: Complaint operations NEVER modify booking, queue, or procurement storage keys.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'kisansetu_complaints';
  const NOTIFICATIONS_KEY = 'kisansetu_notifications';

  const CATEGORIES = [
    { id: 'CENTER_ISSUE', labelHi: 'केंद्र संबंधी समस्या', labelEn: 'Center Issue' },
    { id: 'QUEUE_ISSUE', labelHi: 'कतार / प्रतीक्षा समस्या', labelEn: 'Queue / Waiting Issue' },
    { id: 'BOOKING_ISSUE', labelHi: 'स्लॉट / बुकिंग समस्या', labelEn: 'Booking / Slot Issue' },
    { id: 'GATE_ISSUE', labelHi: 'गेट सत्यापन समस्या', labelEn: 'Gate Verification Issue' },
    { id: 'WEIGHMENT_ISSUE', labelHi: 'तौल / वजन समस्या', labelEn: 'Weighment Issue' },
    { id: 'PROCUREMENT_ISSUE', labelHi: 'खरीद / भुगतान समस्या', labelEn: 'Procurement / Payment Issue' },
    { id: 'RECEIPT_ISSUE', labelHi: 'रसीद समस्या', labelEn: 'Receipt Issue' },
    { id: 'OTHER', labelHi: 'अन्य', labelEn: 'Other' }
  ];

  const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  const STATUSES = {
    OPEN: { hi: 'नई शिकायत', en: 'Open', badgeClass: 'badge-info' },
    ACKNOWLEDGED: { hi: 'शिकायत प्राप्त', en: 'Acknowledged', badgeClass: 'badge-warning' },
    IN_PROGRESS: { hi: 'समाधान प्रक्रिया में', en: 'In Progress', badgeClass: 'badge-medium' },
    RESOLVED: { hi: 'समाधान किया गया', en: 'Resolved', badgeClass: 'badge-success' },
    ESCALATED: { hi: 'उच्च स्तर पर भेजी गई', en: 'Escalated', badgeClass: 'badge-high' },
    CLOSED: { hi: 'बंद', en: 'Closed', badgeClass: 'badge-low' }
  };

  const LEVELS = {
    OPERATOR: { hi: 'खरीद केंद्र ऑपरेटर', en: 'Procurement Operator', tier: 1 },
    DISTRICT_ADMIN: { hi: 'जिला प्रशासन', en: 'District Admin', tier: 2 },
    SUPER_ADMIN: { hi: 'Super Admin (अंतिम स्तर)', en: 'Super Admin (Final)', tier: 3 }
  };

  /**
   * Safe localStorage helper with corrupted data fallback
   */
  function readComplaints() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('KisanComplaints: Error parsing complaints from localStorage. Using empty array.', e);
      return [];
    }
  }

  function writeComplaints(complaints) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
      return true;
    } catch (e) {
      console.error('KisanComplaints: Failed to save complaints to localStorage.', e);
      return false;
    }
  }

  /**
   * Deterministic Sequential Complaint Number Generation (KSC-CMP-0001, KSC-CMP-0002, ...)
   */
  function generateComplaintNumber(existingComplaints) {
    let maxNum = 0;
    existingComplaints.forEach(c => {
      if (c && c.complaintNumber) {
        const match = c.complaintNumber.match(/KSC-CMP-(\d+)/);
        if (match && match[1]) {
          const val = parseInt(match[1], 10);
          if (val > maxNum) maxNum = val;
        }
      }
    });
    const nextNum = maxNum + 1;
    return 'KSC-CMP-' + String(nextNum).padStart(4, '0');
  }

  /**
   * Dispatch system notification
   */
  function dispatchNotification(title, message, type = 'info', recipientRole = null, farmerId = null) {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const entry = {
        id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        title: title,
        message: message,
        type: type,
        recipientRole: recipientRole,
        farmerId: farmerId,
        timestamp: new Date().toISOString(),
        read: false
      };
      list.unshift(entry);
      if (list.length > 50) list.length = 50;
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
    } catch (e) {
      // Safe fallback
    }
  }

  const KisanComplaints = {
    STORAGE_KEY,
    CATEGORIES,
    PRIORITIES,
    STATUSES,
    LEVELS,

    getAllComplaints() {
      return readComplaints();
    },

    getComplaintById(idOrNumber) {
      if (!idOrNumber) return null;
      const list = readComplaints();
      const needle = String(idOrNumber).trim().toUpperCase();
      return list.find(c => c.id === idOrNumber || (c.complaintNumber && c.complaintNumber.toUpperCase() === needle)) || null;
    },

    /**
     * Get complaints visible to Farmer (strictly own complaints)
     */
    getFarmerComplaints(farmerId) {
      if (!farmerId) return [];
      const list = readComplaints();
      return list.filter(c => c.farmerId === farmerId);
    },

    /**
     * Get complaints visible to Operator (assigned to Level 1 / matching center)
     */
    getOperatorComplaints(centerId = null) {
      const list = readComplaints();
      return list.filter(c => {
        // Operator sees Level 1 (OPERATOR) complaints
        const isOperatorLevel = c.currentLevel === 'OPERATOR';
        const matchesCenter = !centerId || !c.relatedCenterId || c.relatedCenterId === centerId;
        return isOperatorLevel && matchesCenter;
      });
    },

    /**
     * Get complaints visible to District Admin (Level 2 ESCALATED complaints)
     */
    getDistrictAdminComplaints(district = null) {
      const list = readComplaints();
      return list.filter(c => {
        return c.currentLevel === 'DISTRICT_ADMIN';
      });
    },

    /**
     * Get complaints visible to Super Admin (Level 3 ESCALATED complaints + Critical oversight)
     */
    getSuperAdminComplaints() {
      const list = readComplaints();
      return list.filter(c => {
        return c.currentLevel === 'SUPER_ADMIN';
      });
    },

    /**
     * Create a new complaint (Farmer action)
     */
    createComplaint(data, currentUser) {
      if (!currentUser || currentUser.role !== 'farmer') {
        return { success: false, error: 'Only farmers can submit new complaints.' };
      }

      if (!data.subject || !data.subject.trim()) {
        return { success: false, error: 'Subject is required / विषय अनिवार्य है।' };
      }
      if (!data.description || !data.description.trim()) {
        return { success: false, error: 'Description is required / विवरण अनिवार्य है।' };
      }
      if (!data.category) {
        return { success: false, error: 'Complaint Category is required / शिकायत श्रेणी अनिवार्य है।' };
      }

      const list = readComplaints();
      const complaintNumber = generateComplaintNumber(list);
      const now = new Date().toISOString();

      const newComplaint = {
        id: 'CMP-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000),
        complaintNumber: complaintNumber,
        farmerId: currentUser.id || 'USR-FARMER-01',
        farmerName: currentUser.name || 'Demo Farmer',
        farmerPhone: currentUser.phone || '',
        category: data.category,
        subject: data.subject.trim(),
        description: data.description.trim(),
        priority: PRIORITIES.includes(data.priority) ? data.priority : 'MEDIUM',
        relatedBookingId: data.relatedBookingId || null,
        relatedCenterId: data.relatedCenterId || null,
        relatedCenterName: data.relatedCenterName || '',
        relatedToken: data.relatedToken || null,
        attachmentName: data.attachmentName || null,
        status: 'OPEN',
        currentLevel: 'OPERATOR',
        createdAt: now,
        updatedAt: now,
        assignedTo: data.relatedCenterId || 'CTR-HR-01',
        assignedRole: 'operator',
        resolution: null,
        escalatedAt: null,
        escalationReason: null,
        history: [
          {
            timestamp: now,
            actor: currentUser.name || 'Farmer',
            role: 'farmer',
            action: 'CREATED',
            note: 'Complaint submitted / शिकायत दर्ज की गई'
          }
        ]
      };

      list.unshift(newComplaint);
      writeComplaints(list);

      // Send simulated notification to Operator
      dispatchNotification(
        'नई शिकायत प्राप्त (New Complaint)',
        `नई शिकायत ${complaintNumber} आपके खरीद केंद्र के लिए दर्ज की गई है।`,
        'info',
        'operator'
      );

      return {
        success: true,
        complaint: newComplaint,
        message: 'आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है। संख्या: ' + complaintNumber
      };
    },

    /**
     * Acknowledge Complaint (Operator)
     */
    acknowledgeComplaint(idOrNumber, currentUser) {
      if (!currentUser || currentUser.role !== 'operator') {
        return { success: false, error: 'Unauthorized. Operator role required.' };
      }

      const list = readComplaints();
      const complaint = list.find(c => c.id === idOrNumber || c.complaintNumber === idOrNumber);
      if (!complaint) return { success: false, error: 'Complaint not found.' };

      if (complaint.currentLevel !== 'OPERATOR') {
        return { success: false, error: 'Complaint is not at Operator level.' };
      }

      const now = new Date().toISOString();
      complaint.status = 'ACKNOWLEDGED';
      complaint.updatedAt = now;
      complaint.history.push({
        timestamp: now,
        actor: currentUser.name || 'Operator',
        role: 'operator',
        action: 'ACKNOWLEDGED',
        note: 'Complaint acknowledged by Center Operator / ऑपरेटर द्वारा संज्ञान लिया गया'
      });

      writeComplaints(list);

      // Notify Farmer
      dispatchNotification(
        'शिकायत संज्ञान में ली गई',
        `आपकी शिकायत ${complaint.complaintNumber} को खरीद केंद्र ऑपरेटर द्वारा देखा गया है।`,
        'info',
        'farmer',
        complaint.farmerId
      );

      return { success: true, complaint };
    },

    /**
     * Start Investigation (Operator, District Admin, Super Admin)
     */
    investigateComplaint(idOrNumber, currentUser) {
      if (!currentUser || !['operator', 'district_admin', 'super_admin'].includes(currentUser.role)) {
        return { success: false, error: 'Unauthorized role.' };
      }

      const list = readComplaints();
      const complaint = list.find(c => c.id === idOrNumber || c.complaintNumber === idOrNumber);
      if (!complaint) return { success: false, error: 'Complaint not found.' };

      // Role check against level
      if (currentUser.role === 'operator' && complaint.currentLevel !== 'OPERATOR') {
        return { success: false, error: 'Operator cannot investigate complaints outside Operator level.' };
      }
      if (currentUser.role === 'district_admin' && complaint.currentLevel !== 'DISTRICT_ADMIN') {
        return { success: false, error: 'District Admin can only investigate District Admin level complaints.' };
      }
      if (currentUser.role === 'super_admin' && complaint.currentLevel !== 'SUPER_ADMIN') {
        return { success: false, error: 'Super Admin can only investigate Super Admin level complaints.' };
      }

      const now = new Date().toISOString();
      complaint.status = 'IN_PROGRESS';
      complaint.updatedAt = now;
      complaint.history.push({
        timestamp: now,
        actor: currentUser.name || currentUser.role,
        role: currentUser.role,
        action: 'IN_PROGRESS',
        note: `Investigation initiated by ${currentUser.name || currentUser.role} / समाधान प्रक्रिया शुरू`
      });

      writeComplaints(list);
      return { success: true, complaint };
    },

    /**
     * Add Note / Comment (All roles)
     */
    addNote(idOrNumber, noteText, currentUser) {
      if (!currentUser) return { success: false, error: 'Authentication required.' };
      if (!noteText || !noteText.trim()) return { success: false, error: 'Note text is required.' };

      const list = readComplaints();
      const complaint = list.find(c => c.id === idOrNumber || c.complaintNumber === idOrNumber);
      if (!complaint) return { success: false, error: 'Complaint not found.' };

      // Role boundary checks
      if (currentUser.role === 'farmer' && complaint.farmerId !== currentUser.id) {
        return { success: false, error: 'Farmer can only comment on their own complaint.' };
      }
      if (currentUser.role === 'operator' && complaint.currentLevel !== 'OPERATOR') {
        return { success: false, error: 'Operator cannot comment on escalated complaints.' };
      }

      const now = new Date().toISOString();
      complaint.updatedAt = now;
      complaint.history.push({
        timestamp: now,
        actor: currentUser.name || currentUser.role,
        role: currentUser.role,
        action: 'COMMENT_ADDED',
        note: noteText.trim()
      });

      writeComplaints(list);
      return { success: true, complaint };
    },

    /**
     * Resolve Complaint (Operator, District Admin, Super Admin)
     */
    resolveComplaint(idOrNumber, resolutionText, currentUser) {
      if (!currentUser || !['operator', 'district_admin', 'super_admin'].includes(currentUser.role)) {
        return { success: false, error: 'Unauthorized role to resolve complaint.' };
      }
      if (!resolutionText || !resolutionText.trim()) {
        return { success: false, error: 'Resolution details are required / समाधान विवरण आवश्यक है।' };
      }

      const list = readComplaints();
      const complaint = list.find(c => c.id === idOrNumber || c.complaintNumber === idOrNumber);
      if (!complaint) return { success: false, error: 'Complaint not found.' };

      // Role hierarchy validation
      if (currentUser.role === 'operator' && complaint.currentLevel !== 'OPERATOR') {
        return { success: false, error: 'Operator cannot resolve complaints at higher levels.' };
      }
      if (currentUser.role === 'district_admin' && complaint.currentLevel !== 'DISTRICT_ADMIN') {
        return { success: false, error: 'District Admin can only resolve District Admin level complaints.' };
      }
      if (currentUser.role === 'super_admin' && complaint.currentLevel !== 'SUPER_ADMIN') {
        return { success: false, error: 'Super Admin can only resolve Super Admin level complaints.' };
      }

      const now = new Date().toISOString();
      complaint.status = 'RESOLVED';
      complaint.resolution = resolutionText.trim();
      complaint.updatedAt = now;
      complaint.history.push({
        timestamp: now,
        actor: currentUser.name || currentUser.role,
        role: currentUser.role,
        action: 'RESOLVED',
        note: resolutionText.trim()
      });

      writeComplaints(list);

      // Notify Farmer
      dispatchNotification(
        'शिकायत का समाधान हुआ (Complaint Resolved)',
        `आपकी शिकायत ${complaint.complaintNumber} का समाधान कर दिया गया है: ${resolutionText.trim().slice(0, 80)}`,
        'success',
        'farmer',
        complaint.farmerId
      );

      return { success: true, complaint };
    },

    /**
     * Escalate Complaint
     * STRICT Hierarchy:
     * - LEVEL 1 (OPERATOR) -> LEVEL 2 (DISTRICT_ADMIN)
     * - LEVEL 2 (DISTRICT_ADMIN) -> LEVEL 3 (SUPER_ADMIN)
     * Direct jumps (Farmer -> Admin, Operator -> Super Admin) are strictly prohibited!
     */
    escalateComplaint(idOrNumber, reasonText, currentUser) {
      if (!currentUser) return { success: false, error: 'Authentication required.' };
      if (!reasonText || !reasonText.trim()) {
        return { success: false, error: 'Escalation reason is required / उच्च स्तर पर भेजने का कारण अनिवार्य है।' };
      }

      const list = readComplaints();
      const complaint = list.find(c => c.id === idOrNumber || c.complaintNumber === idOrNumber);
      if (!complaint) return { success: false, error: 'Complaint not found.' };

      // Farmer cannot escalate
      if (currentUser.role === 'farmer') {
        return { success: false, error: 'Farmers cannot directly escalate complaints.' };
      }

      const now = new Date().toISOString();

      // Tier 1 -> Tier 2
      if (currentUser.role === 'operator') {
        if (complaint.currentLevel !== 'OPERATOR') {
          return { success: false, error: 'Operator can only escalate complaints currently at Operator level.' };
        }
        complaint.status = 'ESCALATED';
        complaint.currentLevel = 'DISTRICT_ADMIN';
        complaint.assignedRole = 'district_admin';
        complaint.escalatedAt = now;
        complaint.escalationReason = reasonText.trim();
        complaint.updatedAt = now;

        complaint.history.push({
          timestamp: now,
          actor: currentUser.name || 'Operator',
          role: 'operator',
          action: 'ESCALATED',
          note: `Escalated to District Admin: ${reasonText.trim()}`
        });

        writeComplaints(list);

        // Notifications
        dispatchNotification(
          'शिकायत जिला प्रशासन को भेजी गई',
          `आपकी शिकायत ${complaint.complaintNumber} जिला प्रशासन को भेज दी गई है।`,
          'warning',
          'farmer',
          complaint.farmerId
        );
        dispatchNotification(
          'नई शिकायत जिला स्तर पर प्राप्त',
          `शिकायत ${complaint.complaintNumber} ऑपरेटर द्वारा जिला स्तर पर भेजी गई है।`,
          'info',
          'district_admin'
        );

        return { success: true, complaint, nextLevel: 'DISTRICT_ADMIN' };
      }

      // Tier 2 -> Tier 3
      if (currentUser.role === 'district_admin') {
        if (complaint.currentLevel !== 'DISTRICT_ADMIN') {
          return { success: false, error: 'District Admin can only escalate complaints at District Admin level.' };
        }
        complaint.status = 'ESCALATED';
        complaint.currentLevel = 'SUPER_ADMIN';
        complaint.assignedRole = 'super_admin';
        complaint.escalatedAt = now;
        complaint.escalationReason = reasonText.trim();
        complaint.updatedAt = now;

        complaint.history.push({
          timestamp: now,
          actor: currentUser.name || 'District Admin',
          role: 'district_admin',
          action: 'ESCALATED',
          note: `Escalated to Super Admin: ${reasonText.trim()}`
        });

        writeComplaints(list);

        // Notifications
        dispatchNotification(
          'शिकायत Super Admin को भेजी गई',
          `आपकी शिकायत ${complaint.complaintNumber} राज्य/केंद्रीय स्तर (Super Admin) को भेज दी गई है।`,
          'warning',
          'farmer',
          complaint.farmerId
        );
        dispatchNotification(
          'नई शिकायत Super Admin स्तर पर प्राप्त',
          `शिकायत ${complaint.complaintNumber} जिला प्रशासन द्वारा Super Admin स्तर पर भेजी गई है।`,
          'warning',
          'super_admin'
        );

        return { success: true, complaint, nextLevel: 'SUPER_ADMIN' };
      }

      return { success: false, error: 'Unauthorized role for escalation.' };
    },

    /**
     * Close Complaint (District Admin, Super Admin)
     */
    closeComplaint(idOrNumber, currentUser) {
      if (!currentUser || !['district_admin', 'super_admin'].includes(currentUser.role)) {
        return { success: false, error: 'Only District Admin or Super Admin can close complaints.' };
      }

      const list = readComplaints();
      const complaint = list.find(c => c.id === idOrNumber || c.complaintNumber === idOrNumber);
      if (!complaint) return { success: false, error: 'Complaint not found.' };

      const now = new Date().toISOString();
      complaint.status = 'CLOSED';
      complaint.updatedAt = now;
      complaint.history.push({
        timestamp: now,
        actor: currentUser.name || currentUser.role,
        role: currentUser.role,
        action: 'CLOSED',
        note: `Complaint formally closed by ${currentUser.name || currentUser.role}`
      });

      writeComplaints(list);

      // Notify Farmer
      dispatchNotification(
        'शिकायत बंद की गई (Complaint Closed)',
        `आपकी शिकायत ${complaint.complaintNumber} आधिकारिक रूप से बंद कर दी गई है।`,
        'info',
        'farmer',
        complaint.farmerId
      );

      return { success: true, complaint };
    },

    /**
     * Formatting Helpers
     */
    getStatusMeta(statusKey) {
      return STATUSES[statusKey] || { hi: statusKey, en: statusKey, badgeClass: 'badge-low' };
    },

    getLevelMeta(levelKey) {
      return LEVELS[levelKey] || { hi: levelKey, en: levelKey, tier: 1 };
    },

    getCategoryLabel(catId, lang = 'hi') {
      const found = CATEGORIES.find(c => c.id === catId);
      if (!found) return catId;
      return lang === 'en' ? found.labelEn : found.labelHi;
    }
  };

  // Export globally
  window.KisanComplaints = KisanComplaints;

})(typeof window !== 'undefined' ? window : global);
