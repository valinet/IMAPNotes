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
	
    Modifications for TB78 by John Bieling (2020)
*/
var waitReady = false;
var editEmailSubjectMain = {
	
	sleep: function(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	},
	
	update: async function(msg, newSubject, format) {
		
		let raw = msg.raw
			.replace(/\r/g, "") //for RFC2822
			.replace(/\n/g, "\r\n");
		
		// extract the header section and include the linebreak belonging to the last header and include
		// a linebreak before the first header
		// prevent blank line into headers and binary attachments broken (thanks to Achim Czasch for fix)
		let headerEnd = raw.search(/\r\n\r\n/);
		let headers = "\r\n" + raw.substring(0, headerEnd+2).replace(/\r\r/,"\r");
		
		var lines = newSubject.split('\n');//gives all lines
		var subject = lines[0];
		
		let body = '\r\n<html><head></head><body style="word-wrap: break-word; -webkit-nbsp-mode: space; line-break: after-white-space;">';
		for (var i = 0; i < lines.length; i++) 
		{
			if (lines[i].startsWith(' ')) lines[i] = lines[i].replace(' ', '&nbsp;');
			if (lines[i].endsWith(' ')) lines[i] = lines[i].slice(0, -1) + "&nbsp;";
			if (lines[i] == '') lines[i] = '<br>';
			body = body + "<div>" + lines[i] + "</div>";
		}
		body = body + "</body></html>\r\n";
		
		// update subject, check if subject is multiline
		while(headers.match(/\r\nSubject: .*\r\n\s+/))
			headers = headers.replace(/(\r\nSubject: .*)(\r\n\s+)/, "$1 ");
		
		// either replace the subject header or add one if missing
		if (headers.includes("\nSubject: ")) {
			headers = headers.replace(/\nSubject: .*\r\n/, "\nSubject: " + unescape(encodeURIComponent(subject)) + "\r\n");
		} else {
			headers += "Subject: " + unescape(encodeURIComponent(subject)) + "\r\n";			
		}
		
		// Some IMAP provider (for ex. GMAIL) doesn't register changes in source if the main headers
		// are not different from an existing message. To work around this limit, the "Date" field is 
		// modified, if necessary, adding a second to the time (or decreasing a second if second are 59)	
		let mailAccount = await browser.accounts.get(msg.folder.accountId);
		if (mailAccount.type == "imap") {
			// https://stackoverflow.com/questions/24500375/get-clients-gmt-offset-in-javascript
			function getTimezoneOffset() {
			  function z(n){return (n<10? '0' : '') + n}
			  var offset = new Date().getTimezoneOffset();
			  var sign = offset < 0? '+' : '-';
			  offset = Math.abs(offset);
			  return sign + z(offset/60 | 0) + z(offset%60);
			}
			
			var d = new Date();
			var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
			var dayName = days[d.getDay()];
			var monthName = months[d.getMonth()];
			// https://stackoverflow.com/questions/18889548/javascript-change-gethours-to-2-digit/18889674
			var currentHours = d.getHours();
			currentHours = ("0" + currentHours).slice(-2);
			var currentMinutes = d.getMinutes();
			currentMinutes = ("0" + currentMinutes).slice(-2);
			var currentSeconds = d.getSeconds();
			currentSeconds = ("0" + currentSeconds).slice(-2);
			var date = dayName + ", " + 
			d.getDate() + " " + monthName + " " + d.getFullYear() + " " +
			currentHours + ":" + currentMinutes + ":" + currentSeconds + " " +
			getTimezoneOffset();
			
			// update date
			headers = headers.replace(/\nDate: .*\r\n/, "\nDate: " + unescape(encodeURIComponent(date)) + "\r\n");
			headers = headers.replace(/\ndate: .*\r\n/, "\ndate: " + unescape(encodeURIComponent(date)) + "\r\n");
		}
		
		// HACK: without changing the message-id, the MessageHeader obj of the new message and the old message will
		//share the same ID. It seems this was not the case in TB68.
		/*let app = "";
		for (var i = 0; i < msg.id; i++)
		{
			app = app + ".1";
		}*/
		
		// https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
		function uuidv4() {
		  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		  );
		}
		
		let uuid = '';
		uuid = uuidv4();
		uuid = uuid.toUpperCase();
		let domain = this.msg.headers["message-id"][0].split('@')[1].slice(0, -1);
		headers = headers.replace(/\nX-Universally-Unique-Identifier: *.*\r\n/i, "\nX-Universally-Unique-Identifier: " + uuid + "\r\n");
		uuid = '<' + uuid + '@' + domain + '>';
		headers = headers.replace(/\nMessage-ID: *.*\r\n/i, "\nMessage-ID: " + uuid + "\r\n");		
				
		//remove the leading linebreak;
		headers = headers.substring(2);
		
		let newID = await messenger.MessageModification.addRaw(headers + body, msg.folder, msg.id);	
		if (newID) {
			console.log("Success [" + msg.id + " vs " + newID + "]");
			await messenger.MessageModification.selectMessage(newID);
			if (format)
			{
				await messenger.messages.delete([msg.id], true);
				console.log("Success [" + msg.id + " vs " + newID + "]");
				await messenger.MessageModification.selectMessage(newID);
				msg.id = newID;
				msg.subject = subject;
				/*headers = headers.replace(/\nMessage-ID: *.*\r\n/i, "\nMessage-ID: " + this.msg.headers["message-id"] + "" + "\r\n");	
				let newID2 = await messenger.MessageModification.addRaw(headers + body, msg.folder, newID);	
				if (newID2) {
					console.log("Success [" + msg.id + " vs " + newID + "]");
					await messenger.MessageModification.selectMessage(newID2);
					await messenger.messages.delete([newID], true);
					msg.id = newID2;
					msg.subject = subject;
				}*/
			}
		}
		
		return msg;
	},

	initMsg: async function(message, msg) {
		let MessageHeader = message;
		msg.folder = MessageHeader.folder;
		msg.subject = MessageHeader.subject;
		msg.date = MessageHeader.date;
		msg.id = MessageHeader.id;
		msg.alreadyModified = false;
		let MessagePart = await browser.messages.getFull(MessageHeader.id);
		msg.body = MessagePart.parts[0].body.replaceAll('</div><div>', '\n').replace(/<[^>]*>/g, '').replaceAll('&nbsp;', ' ').slice(0, -2);
		
		let full = await messenger.messages.getFull(msg.id);
		msg.headers = full.headers;
		msg.raw = await messenger.messages.getRaw(msg.id);
		return msg;
	},

	dup2: async function (info) {
		this.msg = {};

		if (info.selectedMessages && info.selectedMessages.messages.length > 0) 
		{
			for (var i = 0; i < info.selectedMessages.messages.length; i++)
			{
				this.msg = await editEmailSubjectMain.initMsg(info.selectedMessages.messages[i], this.msg);
				
				editEmailSubjectMain.update(this.msg, this.msg.body, false);
			}
		}
	},
	
	dup2Link: async function (o) {
		this.msg = {};

		if (o && o.messages && o.messages.length > 0) {
			for (var i = 0; i < o.messages.length; i++)
			{
				this.msg = await editEmailSubjectMain.initMsg(o.messages[i], this.msg);
			
				await editEmailSubjectMain.update(this.msg, this.msg.body, false);
			}
		}
	},

	edit: async function (info) {
		this.msg = {};

		if (info.selectedMessages && info.selectedMessages.messages.length > 0) 
		{
			for (var i = 0; i < info.selectedMessages.messages.length; i++)
			{
				this.msg = await editEmailSubjectMain.initMsg(info.selectedMessages.messages[i], this.msg);

				//messenger.runtime.onMessage.addListener(this.handleMessage);	
				this.msg.popupWindow = await messenger.windows.create({
					url: "/content/editemailsubjectPopup.html",
					type: "popup"
				});
				
				waitReady = true;
				while (waitReady) {
					await editEmailSubjectMain.sleep(10);
				}
				editEmailSubjectMain.sleep(20);
			}
		} else {
			console.log("No Message Selected!");
		}
	},
	
	editLink: async function (o) {
		this.msg = {};

		if (o && o.messages && o.messages.length > 0)
		{
			for (var i = 0; i < o.messages.length; i++)
			{
				this.msg = await editEmailSubjectMain.initMsg(o.messages[i], this.msg);

				this.msg.popupWindow = await messenger.windows.create({
					url: "/content/editemailsubjectPopup.html",
					type: "popup"
				});
				
				waitReady = true;
				while (waitReady) {
					await editEmailSubjectMain.sleep(10);
				}
				editEmailSubjectMain.sleep(20);
			}
		}
	},

	// communication with popup window
	// this is called within global context
	handleMessage: function(request, sender, sendResponse) {
		if (request && request.action) {
			switch (request.action) {
				case "requestData":
					sendResponse(editEmailSubjectMain.msg);
					waitReady = false;
				break;
				case "requestUpdate":
					if (request.newSubject != editEmailSubjectMain.msg.subject) {
						sendResponse(editEmailSubjectMain.updateMessage(request));
					}
				break;
			}
		}
	},
	
	//change the entire email (add new + delete original)
	updateMessage: async function(request) {		
		return editEmailSubjectMain.update(request.msg, request.newSubject, true);
	}
};
