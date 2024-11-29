/*
Created By: Aleš Trtnik (Trtnik-2)
*/

import { wtPlus } from "../../features/wtPlus/wtPlus";
import { editToolbarApp, editToolbarWiki } from "./editToolbar";
import { createWikitableWizard } from "../../features/wikitable_wizard/wikitable_wizard";
export default [
  {
    button: "Templates",
    items: [
      { featureid: "wtplus", title: "Format Parameters", call: wtPlus, params: { action: "AutoFormat" } },
      { featureid: "wtplus", title: "Edit Template", call: wtPlus, params: { action: "EditTemplate" } },
      { featureid: "wtplus", title: "Add TemplateParam", call: wtPlus, params: { template: "TemplateParam" } },
      { featureid: "wtplus", title: "Add Documentation", call: wtPlus, params: { template: "Documentation" } },
      {
        title: "Add Base Templates",
        items: [
          { featureid: "wtplus", title: "Project Box", call: wtPlus, params: { template: "Project Box" } },
          { featureid: "wtplus", title: "Sticker", call: wtPlus, params: { template: "Sticker" } },
          { featureid: "wtplus", title: "Research Note Box", call: wtPlus, params: { template: "Research Note Box" } },
        ],
      },
      {
        title: "Add Other Templates",
        items: [
          {
            featureid: "wtplus",
            title: "Project Box Instructions",
            call: wtPlus,
            params: { template: "Project Box Instructions" },
          },
        ],
      },
      { featureid: "wtplus", title: "Add any template", call: wtPlus, params: { action: "AddTemplate" } },
    ],
  },
  {
    button: "Categories",
    items: [
      {
        featureid: "wtplus",
        title: "Add any category",
        hint: "Add any category using search for words in name and parent categories.",
        call: wtPlus,
        params: { action: "AddCIBCategory", data: "Any" },
      },
      {
        featureid: "wikitableWizard",
        hint: "Create and/or edit wikitables",
        title: "Wikitable Wizard",
        call: createWikitableWizard,
        params: {},
      },
    ],
  },
  {
    button: "Misc",
    items: [
      {
        featureid: "wtplus",
        title: "Help",
        call: editToolbarWiki,
        params: { wiki: "Space:WikiTree_Plus_Chrome_Extension#On_Template_pages" },
      },
    ],
  },
];
