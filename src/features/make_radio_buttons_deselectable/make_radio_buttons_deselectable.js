/*
Created By: Ian Beacall (Beacall-6)
*/

import $ from "jquery";
import { shouldInitializeFeature } from "../../core/options/options_storage";
import { isSearchPage } from "../../core/pageType";

shouldInitializeFeature("makeRadioButtonsDeselectable").then((result) => {
  if (result) {
    const specifiedRadios = ["#mStatus_DeatDate_blank", "#mStatus_DeathDate_blank"];

    // Decide which radios to apply this logic to
    let radioSelector = "input[type='radio']";
    if (isSearchPage) {
      // On search page, only apply to gender radios
      radioSelector = "input[type='radio'][name='gender']";
    }

    // Names of groups that should not be left blank if specified radios are checked on load
    const groupsNotToLeaveBlank = [];

    // On page load, check if specified radios are checked
    specifiedRadios.forEach(function (selector) {
      const $radio = $(selector);
      if ($radio.length && $radio.prop("checked")) {
        const groupName = $radio.attr("name");
        if (groupName) {
          groupsNotToLeaveBlank.push(groupName);
        }
      }
    });

    // Mousedown event for deselectable radios (excluding specified ones)
    $(radioSelector)
      .not(specifiedRadios.join(", "))
      .on("mousedown", function () {
        $(this).data("wasChecked", $(this).prop("checked"));
      });

    // Click event for deselectable radios (excluding specified ones)
    $(radioSelector)
      .not(specifiedRadios.join(", "))
      .on("click", function () {
        const $radio = $(this);
        const groupName = $radio.attr("name");

        if ($radio.data("wasChecked")) {
          if (groupsNotToLeaveBlank.includes(groupName)) {
            // Do not uncheck if the group should not be left blank
            $radio.prop("checked", true);
          } else {
            // Uncheck the radio
            $radio.prop("checked", false);
          }
        } else {
          // Reset wasChecked data for all radios in the same group
          $("input[name='" + groupName + "']")
            .not($radio)
            .data("wasChecked", false);
        }
      });
  }
});
