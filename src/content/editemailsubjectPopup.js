async function okAndInput(e) {
	if(e.ctrlKey && e.which === 83) {
		msg = await messenger.runtime.sendMessage({action: "requestUpdate", newSubject: document.getElementById("editemailsubjectInput").value, msg: msg});
		document.title = msg.subject;
		//const windowId = (await messenger.windows.getCurrent()).id;
		//await messenger.windows.remove(windowId);	
	}
}

async function cancel(e) {
	const windowId = (await messenger.windows.getCurrent()).id;
	await messenger.windows.remove(windowId);
}
var msg;
async function load() {
	msg = await messenger.runtime.sendMessage({action: "requestData"});
	
	document.title = msg.subject;
	document.getElementById("editemailsubjectInput").value = msg.body;
	
	document.getElementById("editemailsubjectInput").addEventListener("keydown", okAndInput);

	document.getElementById("editemailsubjectInput").focus();
}

document.addEventListener('DOMContentLoaded', load, { once: true });