# IMAP Notes
This is a simple Thunderbird extension (compatible with Thunderbird 78+ as of January 2021) that allows editing notes created, edited and synced from the iPhone Notes app. The notes created in the app are actually saved in a "Notes" folder in your IMAP mail account.

## Known issues

Unfortunately, it seems "something" has changed in latest iOS releases (I tested on iOS 14.3) and sync seems to actually be one-way only; the iPhone never seems to take into account the modifications you do on the server. It just passes its changes to the server. When you edit a note on the phone, the original gets deleted and replaced with a new one and the phone keeps track of it via a local database. The phone never seems to redownload data from the server past the initial download.

The only way I know of to force it to refresh the notes is to go to your account settings in the Settings app, turn syncing for Notes off for your account, confirm having the notes deleted from the iPhone, and then turning back on which will redownload your updated notes from the server.

There has to be another way, as the Notes app on the iPhone syncs with the one on macOS, so there has to be a way for one device to "ping" the other and tell it to resync with the server, but I currently do not know the mechanism. Maybe it is tied to the Apple ID, using some internal API they have... In typical Apple fashion, this is yet another weird behavior besides having a non standard protocol to begin with. At least they could have included a manual 'refresh' button in the Notes app that would have downloaded the latest notes from the server (pull to refresh does not work in the Notes app, like in Mail, even though Notes is basically Mail but only a certain folder). Please, if you know how to solve this, open an issue and tell me, that would really help.

## Installation
IMAP Notes releases can be found [here](https://github.com/valinet/IMAPNotes/releases). Each release will list the relevant changes and provides a link to an XPI file to download the add-on. 

_Note: You need to save the XPI file on your computer (using "save as" from the context menu). If you just click on it, it will be installed in your Firefox browser where it will not work of course. The downloaded file can be installed in Thunderbird using the gear menu in the Add-On Manager._

_Alternatively use Drag&Drop for installing from "Releases" directly to the TB/Addon Manager page. With having both pages open just grap the release in question on github and drag it over to the TB page, release and follow further instructions._

The download contains 2 XPI files:

* imapnotes.xpi - this will install the "Edit IMAP note" context menu entry, that allows you to edit a note that you select in a new window
* imapnotes2.xpi - this will intsall the "Duplicate IMAP note" context menu entry which creates a copy of the currently selected note (so that you have a way to create new notes, but of course, the first note has to be created on the phone which will ensure the correct folder is created on the server)

## Credits
Based on [EditEmailSubject-MX](https://github.com/cleidigh/EditEmailSubject-MX) extension.

## License
[GPL v3](LICENSE)