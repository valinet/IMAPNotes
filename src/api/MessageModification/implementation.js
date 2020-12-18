/* eslint-disable object-shorthand */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { MailServices } = ChromeUtils.import("resource:///modules/MailServices.jsm");

var MessageModification = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {    
    context.callOnClose(this);
    let self = this;
    
    return {
      MessageModification: {

        setSubjectOfMessage: async function(aID, aSubject) {
          let msgHdr = context.extension.messageManager.get(aID);
          if (msgHdr) {
            msgHdr.subject = unescape(encodeURIComponent(aSubject));
            return true;
          }
          return false;
        },
        
        selectMessage: async function(aID) {
          let msgHdr = context.extension.messageManager.get(aID);
          let win = Services.wm.getMostRecentWindow("mail:3pane");
          win.gFolderTreeView.selectFolder(msgHdr.folder, true);
          win.gFolderDisplay.selectMessage(msgHdr);
        },

        getMessageFlags: async function(aID) {
          let msgHdr = context.extension.messageManager.get(aID);
          if (msgHdr) {
            return msgHdr.flags;
          }
          return false;          
        },
        
        addRaw: async function(aContent, aMailFolder, aRefID) {
          return new Promise(function(resolve, reject) {
              let folder = context.extension.folderManager.get(aMailFolder.accountId, aMailFolder.path);
              let key = null;
              let count = 0;
            
              // reference message for flags and stuff
              let refMsgHdr = context.extension.messageManager.get(aRefID);
              
              let copyListener = {
                QueryInterface : ChromeUtils.generateQI(["nsIMsgCopyServiceListener"]),
                GetMessageId: function (messageId) {},
                OnProgress: function (progress, progressMax) {},
                SetMessageKey: function (aKey) {
                  key = aKey;
                  // For IMAP and NEWS messages do not wait for OnStopCopy, but
                  // for the actual addition to the folder.
                  if (folder.server.type == "imap" || folder.server.type == "news") {
                    MailServices.mailSession.AddFolderListener(folderListener, Ci.nsIFolderListener.all);
                  }
                }, 
                OnStartCopy: function () {},
                OnStopCopy: async function (statusCode) {
                    if (statusCode === 0) {
                      // IMAP and NEWS messages are not handled here but by the
                      // folderListener.
                      if (!(folder.server.type == "imap" || folder.server.type == "news")) {
                        postActions(key);
                      }
                    } else {
                      console.log("Error adding message: " + statusCode);
                    }
                }
              }
              
              let folderListener = {
                OnItemAdded: function(parentItem, item, view) {
                    let msgHeader = null;
                    try {
                        msgHeader = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
                    } catch(e) {
                        console.log(e);
                        return;
                    }
                    
                    if (key == msgHeader.messageKey && folder.URI == msgHeader.folder.URI) {
                        count++;
                        // Why ???
                        if  (count > 1) {
                          MailServices.mailSession.RemoveFolderListener(folderListener);
                          postActions();
                        }
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
              
              let postActions = function() {
                let msgHeader = folder.GetMessageHeader(key);
                if (msgHeader.flags & 2) folder.addMessageDispositionState(msgHeader, 0);
                if (msgHeader.flags & 4096) folder.addMessageDispositionState(msgHeader, 1);                  
                resolve(context.extension.messageManager.convert(msgHeader).id);
              }

              if (folder) {
                var tempFile = Services.dirsvc.get("TmpD", Ci.nsIFile);
                tempFile.append("EMS.eml");
                tempFile.createUnique(0, 384); // == 0600, octal is deprecated
                
                var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
                foStream.init(tempFile, 2, 0x200, false); // open as "write only"
                foStream.write(aContent, aContent.length);
                foStream.close();

                var fileSpec = Components.classes["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
                fileSpec.initWithPath(tempFile.path);
                var extService = Components.classes['@mozilla.org/uriloader/external-helper-app-service;1'].getService(Components.interfaces.nsPIExternalAppLauncher);
                extService.deleteTemporaryFileOnExit(fileSpec);

                var copyMess = Components.classes["@mozilla.org/messenger/messagecopyservice;1"].getService(Components.interfaces.nsIMsgCopyService);
                copyMess.CopyFileMessage(fileSpec, folder, null, false, refMsgHdr.flags, refMsgHdr.getStringProperty("keywords"), copyListener, null /*msgWindow*/);
              } else {
                resolve(false);
              }
          });
        }
        
      },
    };
  }
  
  close() {
    // Flush all caches
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }  
};
