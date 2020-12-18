# IMAP Notes
This is a simple Thunderbird extension (compatible with Thunderbird 78+ as of January 2021) that allows editing notes created, edited and synced from the iPhone Notes app. The notes created in the app are actually saved in a "Notes" folder in your IMAP mail account.

## Usage

Simply right click any message in your "Notes" folder and choose either either "Edit IMAP note", either "Duplicate IMAP note". When editing a note, in order to save changes, press [Ctrl] + [S] on your keyboard. Edits are not yet saved automatically (I cannot figure out what event to listen to in JavaScript to detect the popup window closing and still have the document available - I tried `beforeunload` and it does not work).

## Instructions
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