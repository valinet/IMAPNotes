async function main() {

  // define default prefs and migrate legacy settings
  let defaultPrefs = {
    "version": "2.1.1",
    "localOnly": true
  };
  await editEmailSubjectPreferences.setDefaults(defaultPrefs);
  await editEmailSubjectPreferences.migrateFromLegacy(defaultPrefs, "extensions.editemailsubject.");

  messenger.menus.create({
    contexts : ["message_list"],
    id: "edit_email_subject_entry",
    onclick : editEmailSubjectMain.edit.bind(editEmailSubjectMain),
    title: messenger.i18n.getMessage("lang.menuTitle")
  });
  
  /*messenger.menus.create({
    contexts : ["message_list"],
    id: "dup2_email_subject_entry",
    onclick : editEmailSubjectMain.dup2.bind(editEmailSubjectMain),
    title: messenger.i18n.getMessage("lang.menuTitle2")
  });*/
  
}

main();
