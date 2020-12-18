/*
 Copyright (C) 2011-2017 J-C Prin. (jisse44)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

var objEditemailsubject = {
	
	msgFolder : null,	
	msgHeader : null,
	consoleService : Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
    	extSettings : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),


	initDialog : function() {

		objEditemailsubject.consoleService.logStringMessage("EditEmailSubject start");
		document.getElementById("editemailsubjectInput").value = window.arguments[0].subject;
		if (document.getElementById("editemailsubjectOld")!= null) document.getElementById("editemailsubjectOld").value = window.arguments[0].oldSubject;
	},


	exitDialog : function(cancel) {

		window.arguments[0].cancel = cancel;
		if (cancel) return true;

		window.arguments[0].subject = document.getElementById("editemailsubjectInput").value;

		return true;
	},

	getOrigDate : function() {

		var dateOrig = "";
		try {
			var str_message = objEditemailsubject.listener.text;
			if (str_message.indexOf("Date:") > -1) dateOrig = str_message.split("\nDate:")[1].split("\n")[0];
			else if (str_message.indexOf("date:") > -1) dateOrig = str_message.split("\ndate:")[1].split("\n")[0];
			dateOrig = dateOrig.replace(/ +$/,"");
			dateOrig = dateOrig.replace(/^ +/,"");
		}
		catch(e) {}
		return dateOrig;
	},
	
	getOrigSubject : function() {

		var subjectOrig = "";
		try {
			var str_message = objEditemailsubject.listener.text;
			subjectOrig = str_message.split("\X-EditEmailSubject-OriginalSubject:")[1].split("\n")[0];
			subjectOrig = subjectOrig.replace(/ +$/,"");
			subjectOrig = subjectOrig.replace(/^ +/,"");
		}
		catch(e) {}
		return subjectOrig;
	},

	edit: function() {

		// local style
		if (objEditemailsubject.extSettings.getBoolPref("extensions.editemailsubject.localOnly")) {
			
			//var msg = gDBView.hdrForFirstSelectedMessage;
			//objEditemailsubject.msgHeader = msg.QueryInterface(Components.interfaces.nsIMsgDBHdr);
			objEditemailsubject.msgHeader = gDBView.hdrForFirstSelectedMessage;
		
			var newMsgHeader = {};
			newMsgHeader.subject = objEditemailsubject.msgHeader.mime2DecodedSubject;

			window.openDialog("chrome://editemailsubject/content/editemailsubjectPopup.xul","","chrome,modal,centerscreen,resizable ",newMsgHeader);

			if (newMsgHeader.cancel) return;

			objEditemailsubject.msgHeader.subject = unescape(encodeURIComponent(newMsgHeader.subject));
		}
		else {	// IMAP style
			var msgUri = gFolderDisplay.selectedMessageUris[0];
			var mms = messenger.messageServiceFromURI(msgUri).QueryInterface(Components.interfaces.nsIMsgMessageService);

			objEditemailsubject.msgHeader = mms.messageURIToMsgHdr(msgUri);
			objEditemailsubject.msgFolder = objEditemailsubject.msgHeader.folder;
			mms.streamMessage(msgUri, objEditemailsubject.listener, null, null, false, null);
		}	
	},


	cleanNR : function(data) {

		var newData = data.replace(/\r/g, "");	//for RFC2822

		newData = newData.replace(/\n/g, "\r\n");

		return newData;
	},


	listener : {

		QueryInterface : function(iid)  {

	                if (iid.equals(Components.interfaces.nsIStreamListener) || 
        	            iid.equals(Components.interfaces.nsISupports))
        	         return this;
        
        	        throw Components.results.NS_NOINTERFACE;
        	        return 0;
        	},
        
	        onStartRequest : function (aRequest, aContext) {
			objEditemailsubject.listener.text = "";			
		},
            
        	onStopRequest : function (aRequest, aContext, aStatusCode) {

			var isImap = (objEditemailsubject.msgFolder.server.type == "imap") ? true : false;
			var date = objEditemailsubject.getOrigDate();
			var originalSubject = objEditemailsubject.msgHeader.mime2DecodedSubject;				
			var newMsgHeader = {};

			if (objEditemailsubject.msgHeader.flags & 0x0010) originalSubject = "Re: " + originalSubject;
			newMsgHeader.subject = originalSubject;
			newMsgHeader.date = date;
			newMsgHeader.replyto = objEditemailsubject.msgHeader.getStringProperty("replyTo");
			newMsgHeader.author = objEditemailsubject.msgHeader.mime2DecodedAuthor;
			newMsgHeader.recipients = objEditemailsubject.msgHeader.mime2DecodedRecipients;

			var text = objEditemailsubject.listener.text;
			if (text.indexOf("X-EditEmailSubject:") < 0) window.openDialog("chrome://editemailsubject/content/editemailsubjectPopup.xul","","chrome,modal,centerscreen,resizable",newMsgHeader);
			else {
				newMsgHeader.oldSubject = objEditemailsubject.getOrigSubject();
				window.openDialog("chrome://editemailsubject/content/editemailsubjectPopup2.xul","","chrome,modal,centerscreen,resizable",newMsgHeader);
			}

			if (newMsgHeader.cancel) return;
		
			var newSubject = unescape(encodeURIComponent(newMsgHeader.subject));
			var newAuthor = unescape(encodeURIComponent(newMsgHeader.author));		
			var newRecipients = unescape(encodeURIComponent(newMsgHeader.recipients));

			var newReplyto = "";
			if (newMsgHeader.replyto) newReplyto = unescape(encodeURIComponent(newMsgHeader.replyto));
			else newReplyto = null;
		
			var data = objEditemailsubject.cleanNR(objEditemailsubject.listener.text);
			var headerEnd = data.search(/\r\n\r\n/);
			var headers = data.substring(0,headerEnd);

			while(headers.match(/\r\nSubject: .*\r\n\s+/))
				headers = headers.replace(/(\r\nSubject: .*)(\r\n\s+)/, "$1 ");

			while(headers.match(/\r\nFrom: .*\r\n\s+/))
				headers = headers.replace(/(\r\nFrom: .*)(\r\n\s+)/, "$1 ");

			while(headers.match(/\r\nTo: .*\r\n\s+/))
				headers = headers.replace(/(\r\nTo: .*)(\r\n\s+)/, "$1 ");

			if (headers.indexOf("\nSubject:") > -1) headers = headers.replace(/\nSubject: .*\r\n/, "\nSubject: " + newSubject + "\r\n");
			else if (headers.indexOf("\nsubject:") > -1) headers = headers.replace(/\nsubject: *.*\r\n/, "\nsubject: " + newSubject+ "\r\n");
			else headers = headers + ("\r\nSubject: " + newSubject);

			if (headers.indexOf("From:") > -1) headers = headers.replace(/\nFrom: .*\r\n/, "\nFrom: " + newAuthor + "\r\n");
			else if (headers.indexOf("\nfrom:") > -1) headers = headers.replace(/\nfrom: *.*\r\n/, "\nfrom: " + newAuthor + "\r\n");
			else headers = headers + ("\r\nFrom: " + newAuthor);

			if (headers.indexOf("To:") > -1) headers = headers.replace(/\nTo: .*\r\n/, "\nTo: " + newRecipients + "\r\n");
			else if (headers.indexOf("\nto:") > -1) headers = headers.replace(/\nto: *.*\r\n/, "\nto: " + newRecipients + "\r\n");
			else headers = headers + ("\r\nTo: " + newRecipients);

			if (headers.indexOf("Date:") > -1) headers = headers.replace(/\nDate: .*\r\n/, "\nDate: " + newMsgHeader.date + "\r\n");
			else if (headers.indexOf("\ndate:") > -1) headers = headers.replace(/\ndate: *.*\r\n/, "\ndate: " + newMsgHeader.date + "\r\n");
			else headers = headers + ("\r\nDate: " + newMsgHeader.date);

			if (headers.indexOf("\nMessage-ID:") > -1) headers = headers.replace(/\nMessage-ID: *.*\r\n/, "\nMessage-ID: " + newMsgHeader.mid + "\r\n");
			else if (newMsgHeader.mid) headers = headers + ("\r\nMessage-ID: " + newMsgHeader.mid);

			if (headers.indexOf("\nReferences:") > -1) headers = headers.replace(/\nReferences: *.*\r\n/, "\nReferences: " + newMsgHeader.ref + "\r\n");
			else if (newMsgHeader.ref) headers = headers + ("\r\nReferences: " + newMsgHeader.ref);

			if (newReplyto) {
				if (headers.indexOf("Reply-To:") > -1) headers = headers.replace(/\nReply\-To: .*\r\n/, "\nReply-To: " + newMsgHeader.replyto + "\r\n");
				else if (headers.indexOf("reply-to:") > -1) headers = headers.replace(/\nreply\-to: *.*\r\n/, "\nreply-to: " + newMsgHeader.replyto + "\r\n");
				else headers = headers + ("\r\nReply-To: " + newMsgHeader.replyto);
			} 
			
			/* Hack to prevent blank line into headers and binary attachments broken. Thanks to Achim Czasch for fix */		
			headers = headers.replace(/\r\r/,"\r");
	
			data = headers + data.substring(headerEnd);

			data = data.replace(/^From - .+\r\n/, "");
			data = data.replace(/X-Mozilla-Status.+\r\n/, "");
			data = data.replace(/X-Mozilla-Status2.+\r\n/, "");
			data = data.replace(/X-Mozilla-Keys.+\r\n/, "");

			
			var now = new Date;
			var EditEmailSubjectHead = "X-EditEmailSubject: " + now.toString();
			EditEmailSubjectHead = EditEmailSubjectHead.replace(/\(.+\)/, "");
			EditEmailSubjectHead = EditEmailSubjectHead.substring(0,75);

			var EditEmailSubjectOriginal = "X-EditEmailSubject-OriginalSubject: " + objEditemailsubject.msgHeader.mime2DecodedSubject;
			EditEmailSubjectOriginal = EditEmailSubjectOriginal.replace(/\(.+\)/, "");

			if (data.indexOf("\nX-EditEmailSubject: ") < 0) data = data.replace("\r\n\r\n","\r\n" + EditEmailSubjectHead + "\r\n" + EditEmailSubjectOriginal + "\r\n\r\n");
			else data = data.replace(/\nX-EditEmailSubject: .+\r\n/,"\n" + EditEmailSubjectHead + "\r\n");
				
						
			if (isImap) {
				objEditemailsubject.consoleService.logStringMessage("isImap");
				// Some IMAP provider (for ex. GMAIL) doesn't register changes in source if the main headers
				// are not different from an existing message. To work around this limit, the "Date" field is 
				// modified, if necessary, adding a second to the time (or decreasing a second if second are 59)
				var newDate = date.replace(/(\d{2}):(\d{2}):(\d{2})/, function (str, p1, p2, p3) {
					var seconds = parseInt(p3) + 1; 
					if (seconds > 59) seconds = 58;
					if (seconds < 10) seconds = "0" + seconds.toString(); 
					return p1 + ":" + p2 + ":" + seconds});
				data = data.replace(date,newDate);
			}

			var tempFile = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);  
			tempFile.append("EMS.eml");
			tempFile.createUnique(0,0664);

			var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
			foStream.init(tempFile, 2, 0x200, false);
			foStream.write(data,data.length);
			foStream.close();
					
			var flags = objEditemailsubject.msgHeader.flags;
			var keys = objEditemailsubject.msgHeader.getStringProperty("keywords");

			objEditemailsubject.list = Components.classes["@mozilla.org/array;1"].createInstance(Components.interfaces.nsIMutableArray);
			objEditemailsubject.list.appendElement(objEditemailsubject.msgHeader, false);

			var fileSpec = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
			fileSpec.initWithPath(tempFile.path);
			var folderCopy = objEditemailsubject.msgHeader.folder;
			var extService = Components.classes['@mozilla.org/uriloader/external-helper-app-service;1'].getService(Components.interfaces.nsPIExternalAppLauncher);
			extService.deleteTemporaryFileOnExit(fileSpec);

			var copyMess = Components.classes["@mozilla.org/messenger/messagecopyservice;1"].getService(Components.interfaces.nsIMsgCopyService);
			copyMess.CopyFileMessage(fileSpec, folderCopy, null, false, flags, keys, objEditemailsubject.copyListener, msgWindow);

			//folderCopy.copyFileMessage(fileSpec, null, false, flags, keys, null, objEditemailsubject.copyListener);

		},
	
         	onDataAvailable : function (aRequest, aContext, aInputStream, aOffset, aCount) {

			var scriptInStream = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance().QueryInterface(Components.interfaces.nsIScriptableInputStream);
			scriptInStream.init(aInputStream);
			objEditemailsubject.listener.text += scriptInStream.read(scriptInStream.available());
	     }        
	},


	copyListener : {

		QueryInterface : function(iid) {

			if (iid.equals(Components.interfaces.nsIMsgCopyServiceListener) ||
			iid.equals(Components.interfaces.nsISupports))
			return this;

			throw Components.results.NS_NOINTERFACE;
			return 0;
		},

		GetMessageId: function (messageId) {},
		OnProgress: function (progress, progressMax) {},
		OnStartCopy: function () {},
		OnStopCopy: function (status) {},

		SetMessageKey: function (key) {

			if (objEditemailsubject.msgFolder.server.type == "imap" || objEditemailsubject.msgFolder.server.type == "news") {
				Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession).AddFolderListener(objEditemailsubject.folderListener, Components.interfaces.nsIFolderListener.all);
				objEditemailsubject.folderListener.key = key;
				objEditemailsubject.folderListener.URI = objEditemailsubject.msgFolder.URI;
			}
			else setTimeout(function() {objEditemailsubject.postActions(key);}, 500);
		} 
	},

	postActions : function(key) {

		gDBView.selectMsgByKey(key);
		var msgHeader = objEditemailsubject.msgFolder.GetMessageHeader(key);

		if (msgHeader.flags & 2) objEditemailsubject.msgFolder.addMessageDispositionState(msgHeader,0);
	        if (msgHeader.flags & 4096) objEditemailsubject.msgFolder.addMessageDispositionState(msgHeader,1);
		
		objEditemailsubject.msgFolder.deleteMessages(objEditemailsubject.list,null,true,true,null,false);
	},

	folderListener  : { 

		OnItemAdded: function(parentItem, item, view) {

			try {
				var msgHeader = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
			} 
			catch(e) {
		             return;
			}
			if (objEditemailsubject.folderListener.key == msgHeader.messageKey && objEditemailsubject.folderListener.URI == msgHeader.folder.URI) {
				objEditemailsubject.postActions(objEditemailsubject.folderListener.key);
				Components.classes["@mozilla.org/messenger/services/session;1"].getService(Components.interfaces.nsIMsgMailSession).RemoveFolderListener(objEditemailsubject.folderListener);
			}            
		},

		OnItemRemoved: function(parentItem, item, view) {},
		OnItemPropertyChanged: function(item, property, oldValue, newValue) {},
		OnItemIntPropertyChanged: function(item, property, oldValue, newValue) {},
		OnItemBoolPropertyChanged: function(item, property, oldValue, newValue) {},
		OnItemUnicharPropertyChanged: function(item, property, oldValue, newValue){},
		OnItemPropertyFlagChanged: function(item, property, oldFlag, newFlag) {},
		OnItemEvent: function(folder, event) {}
	}
};


