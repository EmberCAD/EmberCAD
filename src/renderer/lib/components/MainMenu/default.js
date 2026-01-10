export function menuTemplate(label) {
  label = label || 'My Cherry App';
  return [
    {
      label: label,
      id: 'main',
      submenu: [
        {
          label: `About`,
          id: 'MM1'
        },
        {
          type: 'separator'
        },
        {
          label: `HideBar`,
          id: 'MM_Hide_Bar',
          visible: !isMac
        },
        {
          type: 'separator'
        },
        {
          label: `Exit`,
          id: 'MM_Exit'
        },
        {
          label: `Quit`,
          id: 'MM_Quit',
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    }
  ];
}
