import { isMac } from '../lib/components/Application/Application';

interface RecentMenuItem {
  id: string;
  label: string;
}

export function setupMenu(recentItems: RecentMenuItem[] = []) {
  const buildRecentSubmenu = () =>
    (recentItems.length
      ? recentItems.map((item) => ({
          label: item.label,
          id: item.id,
        }))
      : [
          {
            label: 'No Recent Files',
            id: 'MM_OpenRecent_None',
          },
        ]);

  const mySipleMenuTemplate = [
    {
      label: 'EmberCAD',
      id: 'main',
      submenu: [
        {
          label: `About`,
          id: 'MM1',
        },
        {
          type: 'separator',
        },
        {
          label: `Quit`,
          id: 'MM_Quit',
          accelerator: 'CmdOrCtrl+Q',
        },
      ],
    },
    {
      label: 'File',
      id: 'MFile',
      submenu: [
        {
          label: `New`,
          id: 'MM_New',
          accelerator: 'CmdOrCtrl+N',
        },
        {
          type: 'separator',
        },
        {
          label: `Open`,
          id: 'MM_Open',
          accelerator: 'CmdOrCtrl+O',
        },
        {
          label: `Open Recent`,
          id: 'ORecent',
          submenu: buildRecentSubmenu(),
        },
        {
          label: 'Import...',
          id: 'MM_Import',
          accelerator: 'CmdOrCtrl+I',
        },
        {
          type: 'separator',
        },
        {
          label: `Close`,
        },
        {
          type: 'separator',
        },
        {
          label: `Save`,
          id: 'MM_Save',
          accelerator: 'CmdOrCtrl+S',
        },
        {
          label: `Save As...`,
          id: 'MM_SaveAs',
          accelerator: 'CmdOrCtrl+Shift+S',
        },
        {
          type: 'separator',
        },
        {
          label: `Export`,
        },
      ],
    },
    {
      label: 'Edit ',
      id: 'MM_Edit',
      submenu: [
        {
          label: `Undo`,
          id: 'MM_Undo',
          accelerator: 'CmdOrCtrl+Z',
        },
        {
          label: `Redo`,
          id: 'MM_Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
        },
        {
          type: 'separator',
        },
        {
          label: `Duplicate`,
          id: 'MM_Duplicate',
          accelerator: 'CmdOrCtrl+D',
        },
        {
          type: 'separator',
        },
        {
          label: `Remove`,
          id: 'MM_Remove',
          accelerator: 'Backspace',
        },
        {
          label: `Delete`,
          id: 'MM_Remove',
          visible: false,
          accelerator: 'Delete',
        },
        {
          type: 'separator',
        },
        {
          label: `Open`,
        },
        {
          label: `Open Recent`,
          id: 'ORecent',
          submenu: buildRecentSubmenu(),
        },
        {
          type: 'separator',
        },
        {
          label: `Close`,
        },
        {
          type: 'separator',
        },
        {
          label: `Save`,
          visible: false,
        },
        {
          label: `Save As...`,
        },
        {
          type: 'separator',
        },
        {
          label: `Export`,
        },
      ],
    },
    {
      label: 'Text',
    },
    {
      label: 'Layer',
    },
    {
      label: 'Select',
      id: 'M_Select',
      submenu: [
        {
          label: `Select All`,
          id: 'MM_SelAll',
          accelerator: 'CmdOrCtrl+A',
        },
        {
          label: 'Select None',
          id: 'MM_SelNone',
          accelerator: 'Escape',
        },
        {
          type: 'separator',
        },
        {
          label: `Group`,
          id: 'MM_Group',
          accelerator: 'CmdOrCtrl+G',
        },
        {
          label: 'Ungroup',
          id: 'MM_Ungroup',
          accelerator: 'CmdOrCtrl+U',
        },
      ],
    },
    {
      label: 'View',
      id: 'View',
      submenu: [
        {
          label: `Zoom to Fit`,
          id: 'MM_ZoomFit',
          accelerator: 'CmdOrCtrl+0',
        },
        {
          label: `Zoom to Selection`,
          id: 'MM_ZoomSelection',
          accelerator: 'CmdOrCtrl+Shift+0',
        },
        {
          label: `Zoom to Frame`,
          id: 'MM_ZoomFrame',
          accelerator: 'CmdOrCtrl+9',
        },
      ],
    },
    {
      label: 'Laser',
      id: 'Laser',
      submenu: [
        {
          label: `Remote Control App`,
          id: 'remote',
        },
        {
          type: 'separator',
        },
        {
          label: `Rotary Setup`,
        },
        {
          type: 'separator',
        },
        {
          label: `Materila Test`,
        },
        {
          label: `Interval Test`,
        },
      ],
    },

    {
      label: 'Help',
    },
  ];

  window['App'].mainMenu.setMenu(mySipleMenuTemplate);
}
