import $ from "jquery";
import Cookies from "js-cookie";
import {
  mainDomain,
  isSearchPage,
  isProfileEdit,
  isProfileAddRelative,
  isAddUnrelatedPerson,
  isWikiEdit,
  isNavHomePage,
  isSpecialTrustedList,
  isProfilePage,
  isSpecialMyConnections,
  isSpacePage,
  isPlusDomain,
  isSpaceEdit,
  isCategoryEdit,
} from "../../core/pageType";
import "./usability_tweaks.css";
import { shouldInitializeFeature, getFeatureOptions } from "../../core/options/options_storage";
import { getUserWtId, getUserNumId } from "../../core/common";
import "../../core/common.css";
import { getWikiTreePage } from "../../core/API/wwwWikiTree";
import { WikiTreeAPI } from "../../core/API/WikiTreeAPI";
import { theSourceRules } from "../bioCheck/SourceRules.js";
import { BioCheckPerson } from "../bioCheck/BioCheckPerson.js";
import { Biography } from "../bioCheck/Biography.js";
import { initBioCheck } from "../bioCheck/bioCheck.js";

function addSaveSearchFormDataButton() {
  const searchResultsP = $("span.large:contains('Search Results')").parent();
  if (searchResultsP.length > 0) {
    searchResultsP.append(
      '<button id="saveSearchFormButton" title="Save the person details in this form to populate the fields of the Add Person edit form" class="button small">Save person details</button>'
    );
    $("#saveSearchFormButton").on("click", function () {
      const aPerson = {};
      aPerson.FirstName = $("#wpFirst").val();
      aPerson.LastNameAtBirth = $("#wpLast").val();
      aPerson.BirthDate = $("input[name='wpBirthDate']").val();
      aPerson.DeathDate = $("input[name='wpDeathDate']").val();
      aPerson.BirthLocation = $("input[name='birth_location']").val();
      aPerson.DeathLocation = $("input[name='death_location']").val();
      aPerson.Gender = $("input[name='gender']:checked").val() || "";
      localStorage.setItem("searchFormPerson", JSON.stringify(aPerson));
    });
  }
}

function addUseSearchFormDataButton() {
  if (localStorage.searchFormPerson) {
    const aPerson = JSON.parse(localStorage.searchFormPerson);
    const aPersonName = aPerson.FirstName + " " + aPerson.LastNameAtBirth;
    const useSearchFormDataButton = `<button id="useSearchFormDataButton" title="Use the saved search form data to fill in the fields" class="button small">Fill form with saved data for ${aPersonName}</button>`;
    const deleteSearchFromDataButton = `<button id="deleteSearchFromDataButton" title="Delete the saved search form data" class="button small">X</button>`;
    $("h1").after($(useSearchFormDataButton), $(deleteSearchFromDataButton));
    $("#deleteSearchFromDataButton").on("click", function () {
      localStorage.removeItem("searchFormPerson");
      $("#useSearchFormDataButton").remove();
      $("#deleteSearchFromDataButton").remove();
    });
    $("#useSearchFormDataButton").on("click", function () {
      // Get keys from localStorage.searchFormPerson
      const keys = Object.keys(aPerson);
      // Add the values to the form.  The form IDs are the same as the keys, preceded by "m".
      keys.forEach((key) => {
        $(`#m${key}`).val(aPerson[key]);
      });
      // If #actionButton is visible, click it.
      if ($("#actionButton").is(":visible")) {
        $("#actionButton").trigger("click");
      }
      localStorage.removeItem("searchFormPerson");
      $("#useSearchFormDataButton").remove();
      $("#deleteSearchFromDataButton").remove();
    });
  }
}

function waitForCodeMirror(callback) {
  const checkInterval = setInterval(function () {
    if (window.CodeMirror) {
      clearInterval(checkInterval);
      callback();
    }
  }, 100);
}

function rememberTextareaHeight() {
  const textarea = document.getElementById("wpTextbox1");
  const enhancedEditorButton = document.getElementById("toggleMarkupColor");
  const storedHeight = localStorage.getItem("textareaHeight");
  const storedWidth = localStorage.getItem("textareaWidth");

  if (textarea) {
    if (storedHeight) {
      textarea.style.height = storedHeight + "px";
    }
    if (storedWidth) {
      textarea.style.width = storedWidth + "px";
    }

    textarea.addEventListener("mouseup", function () {
      localStorage.setItem("textareaHeight", textarea.offsetHeight);
      localStorage.setItem("textareaWidth", textarea.offsetWidth);
    });
  }

  if (enhancedEditorButton) {
    enhancedEditorButton.addEventListener("click", function () {
      waitForCodeMirror(function () {
        const cm = window.CodeMirror.fromTextArea(document.getElementById("wpTextbox1"));
        if (storedHeight || storedWidth) {
          cm.setSize(storedWidth ? storedWidth + "px" : null, storedHeight ? storedHeight + "px" : null);
        }
      });
    });
  }
}

function initObserver() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        const addedNodes = Array.from(mutation.addedNodes);
        if (addedNodes.some((node) => node.classList && node.classList.contains("CodeMirror"))) {
          waitForCodeMirror(function () {
            const cm = window.CodeMirror.fromTextArea(document.getElementById("wpTextbox1"));
            const storedHeight = localStorage.getItem("textareaHeight");
            if (storedHeight) {
              cm.setSize(null, storedHeight + "px");
            }
          });
          observer.disconnect();
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function addScratchPadButton() {
  let isProgrammaticClick = false;

  // Clone both buttons initially
  let editButton = $("input[value='Edit Scratch Pad']").clone().attr("id", "clonedEditButton");
  let saveButton = $("input[value='Save Scratch Pad Changes']").clone().attr("id", "clonedSaveButton");

  // Function to update button visibility and events
  function updateButtonVisibility() {
    if ($("input[value='Edit Scratch Pad']:not(#clonedEditButton)").is(":visible")) {
      $("#clonedEditButton").show();
      $("#clonedSaveButton").hide();
    } else {
      $("#clonedEditButton").hide();
      $("#clonedSaveButton").show();
    }
  }

  // Bind click events to original buttons
  editButton.on("click", function () {
    if (!isProgrammaticClick) {
      isProgrammaticClick = true;
      $("input[value='Edit Scratch Pad']:not(#clonedEditButton)").click();
      setTimeout(updateButtonVisibility, 500);
      isProgrammaticClick = false;
    }
  });

  saveButton.click(function () {
    if (!isProgrammaticClick) {
      isProgrammaticClick = true;
      $("input[value='Save Scratch Pad Changes']:not(#clonedSaveButton)").click();
      setTimeout(updateButtonVisibility, 1000);
      isProgrammaticClick = false;
    }
  });

  // Add cloned buttons to the DOM
  editButton.insertAfter($("h2:contains(Scratch Pad) + p"));
  saveButton.insertAfter($("h2:contains(Scratch Pad) + p"));

  // Initial setup
  updateButtonVisibility();

  // Bind click events to original buttons that update the visibility of the cloned buttons
  $("input[value='Edit Scratch Pad'], input[value='Save Scratch Pad Changes']").on("click", function () {
    setTimeout(updateButtonVisibility, 1000);
  });
}

function toggleNonMembers() {
  $(".wt.names tr").each(function () {
    if ($(this).find("a[href*='/wiki/']").length > 0 && $(this).find("img[alt='Active member']").length == 0) {
      $(this).toggle();
    }
  });
  $("#onlyMembers").toggleClass("active");
  if ($("#onlyMembers").hasClass("active")) {
    Cookies.set("onlyMembers", 1);
  } else {
    Cookies.set("onlyMembers", 0);
  }
}

async function onlyMembers() {
  $("p")
    .eq(0)
    .append(
      $(
        `<span class='small'>[<a id='onlyMembers' title="Show only the active members on this page">only active members</a>]</span>`
      )
    );
  $("#onlyMembers").on("click", function () {
    toggleNonMembers();
    return;
  });
  if (Cookies.get("onlyMembers") == 1) {
    toggleNonMembers();
  }
}

function getUserIds() {
  // Select the submenu containing the links
  let submenu = $('ul[data-menu="My_WikiTree"]');

  // Initialize variables to store the extracted IDs
  let Name = null;
  let Id = null;

  // Check if the submenu exists
  if (submenu.length) {
    // Find the Profile link
    let profileLink = submenu.find('a:contains("Profile")');
    if (profileLink.length) {
      // Extract the Profile ID
      let profileHref = profileLink.attr("href");
      Name = profileHref.split("/").pop().replace("wiki/", "");
    }

    // Find the Suggestions link
    let suggestionsLink = submenu.find('a[href*="WTWebUser/Suggestions.htm"]');
    if (suggestionsLink.length) {
      // Extract the User ID from the Suggestions link
      let suggestionsHref = suggestionsLink.attr("href");
      let urlParams = new URLSearchParams(suggestionsHref.split("?")[1]);
      Id = urlParams.get("UserID");
    }
  }
  return { Id: Id, Name: Name };
}

function addRemoveMeButton() {
  const removeMeButton = $(
    `<button id="removeMeButton" title="Double-click to remove yourself as manager of this profile" class="button small">❌</button>`
  );
  const ids = getUserIds();
  const thisUserWTID = ids.Name || getUserWtId();
  const thisUserId = ids.Id || getUserNumId();

  // First, select the <span> elements containing 'Profile manager'
  const spanElements = $("span:contains('Profile manager')");
  let targetAnchor;
  // Then, for each span element found, navigate to its parent and find the desired <a> element
  spanElements.each(function () {
    const parentElement = $(this).parent();
    targetAnchor = parentElement.find(`a[href*='/wiki/${thisUserWTID}']`);
    // Do something with targetAnchor
  });
  const profileManagerLink = $(targetAnchor);
  //const profileManagerLink = $(`span:contains('Profile manager').parent().find("a[href*='/wiki/${thisUserWTID}']")`);
  if (profileManagerLink.length) {
    const profileManagerWTID = profileManagerLink.attr("href").split("/").pop();

    if (profileManagerWTID == thisUserWTID) {
      profileManagerLink.after(removeMeButton);
      $(`a[data-who='${thisUserId}']:contains(send)`).text("email");
      removeMeButton.on("dblclick", function (e) {
        e.preventDefault();
        const privacyTab = $(`a[title="View Privacy Settings and Trusted List"]`);
        privacyTab.attr("href", privacyTab.attr("href") + "&WBEaction=RemoveMe");
        window.location = privacyTab.attr("href");
      });
    }
  }
}

function removeMe() {
  if (window.location.href.includes("WBEaction=RemoveMe")) {
    const removeYourselfButton = $("input[value='Remove Yourself']");
    removeYourselfButton.trigger("click");
  }
}

function forwardToSavedSpagePage() {
  const boxClass = "status green";
  const greenBoxes = document.getElementsByClassName(boxClass);
  const searchParams = new URLSearchParams(window.location.search);
  const savedParam = "saveRedir";
  if (
    greenBoxes.length == 1 &&
    greenBoxes[0].innerText.indexOf("Changes Saved.") > -1 &&
    !searchParams.has(savedParam)
  ) {
    searchParams.append(savedParam, "WBE");
    window.location.search = searchParams;
  } else if (searchParams.has(savedParam)) {
    //make sure, scissors are loaded first
    var delayInMilliseconds = 300;
    setTimeout(function () {
      const div = document.createElement("div");
      div.className = boxClass;
      div.style.marginTop = "1em";
      div.innerHTML = "<span class='larger'>Changes Saved.</span>";
      document.getElementsByTagName("h1")[0].appendChild(div);
    }, delayInMilliseconds);
  }
}

function triggerRememberTextareaHeight() {
  window.addEventListener("load", () => {
    // Call the function on load
    rememberTextareaHeight();

    // Initialize the observer
    initObserver();

    // Trigger the button click event twice
    const enhancedEditorButton = document.getElementById("toggleMarkupColor");
    if (enhancedEditorButton) {
      enhancedEditorButton.click();
      enhancedEditorButton.click();
    }
  });
}

function putFocusOnFirstNameField() {
  if (isAddUnrelatedPerson) {
    document.getElementById("mFirstName").focus();
  } else if (isProfileAddRelative) {
    const enterBasicDataButton = document.getElementById("actionButton");
    let timeoutShowBasicData = null;
    if (enterBasicDataButton) {
      enterBasicDataButton.addEventListener("click", function () {
        clearTimeout(timeoutShowBasicData);
        timeoutShowBasicData = setTimeout(function () {
          document.getElementById("mFirstName").focus();
        }, 300);
      });
    }
  }
}

function autoClickAddPersonOptions() {
  setTimeout(function () {
    const whoValue = new URL(window.location.href).searchParams.get("who");
    const WBEactionValue = new URL(window.location.href).searchParams.get("WBEaction");
    if (WBEactionValue) {
      if (WBEactionValue == "Add") {
        $("#editAction_createNew").trigger("click");
      } else if (WBEactionValue == "Connect") {
        $("#editAction_connectExisting").trigger("click");
      } else if (WBEactionValue == "Remove") {
        $("#editAction_remove").trigger("click");
      }
      if (WBEactionValue == "Add" || (WBEactionValue == "Remove" && whoValue != "child" && whoValue != "spouse")) {
        $("#actionButton").trigger("click");
      }
    }
  }, 300);
}

function replaceAddRemoveReplaceLinks() {
  if (isProfilePage) {
    const editFamilyLinks = document.getElementsByClassName("BLANK");
    for (let i = 0; i < editFamilyLinks.length; i++) {
      switch (editFamilyLinks[i].innerText) {
        case "[mother?]":
        case "[father?]":
        case "[spouse?]":
        case "[add spouse?]":
        case "[add child]":
        case "[children?]":
        case "[brothers or sisters?]":
        case "[add sibling]": {
          if (editFamilyLinks[i].tagName == "A") {
            editFamilyLinks[i].href = editFamilyLinks[i].href + "&WBEaction=Add";
          } else if (editFamilyLinks[i].tagName == "SPAN") {
            editFamilyLinks[i].firstChild.href = editFamilyLinks[i].firstChild.href + "&WBEaction=Add";
          }

          break;
        }
      }
    }
  }
  if (isProfileEdit) {
    const hasFather = $("input[name='mStatus_Father']").length;
    const hasMother = $("input[name='mStatus_Mother']").length;
    const hasSpouse = $("div.five.columns.omega a:Contains(edit marriage)").length;
    $("div.five.columns.omega a[href*='&who=']").each(function () {
      /* Replace one link like this: https://wikitree.com/index.php?title=Special:EditFamily&u=23943734&who=father
       * with three links like this: https://wikitree.com/index.php?title=Special:EditFamily&u=23943734&who=father&WBEaction=add (remove, connect)
       */
      if ($(this).text().includes("edit marriage") == false) {
        const href = "https://" + mainDomain + $(this).attr("href");
        const urlObject = new URL(href);
        const whoValue = urlObject.searchParams.get("who");

        let addText = "Add";
        let addTitle = "Add a " + whoValue;
        let removeTitle = "Remove a " + whoValue;

        if (whoValue == "father") {
          if (hasFather) {
            addText = "Replace";
            addTitle = "Replace this father";
          } else {
            addText = "Add";
          }
        } else if (whoValue == "mother") {
          if (hasMother) {
            addText = "Replace";
            addTitle = "Replace this mother";
          } else {
            addText = "Add";
          }
        } else if (whoValue == "spouse" && hasSpouse) {
          removeTitle = "Remove a spouse";
        } else if (whoValue == "child") {
          removeTitle = "Remove a child";
        }

        if (
          whoValue != "sibling" &&
          !(whoValue == "father" && hasFather == 0) &&
          !(whoValue == "mother" && hasMother == 0)
        ) {
          const newHref = href + "&WBEaction=Remove";
          const newLink = $(this).clone();
          newLink.attr("href", newHref);
          newLink.text("Remove");
          $(this).after(newLink);
          $(this).after(" | ");
          newLink.attr("title", removeTitle);
        }

        const newLink2 = $(this).clone();
        newLink2.attr("href", href + "&WBEaction=Connect");
        newLink2.text("Connect");
        $(this).after(newLink2);
        $(this).after(" | ");
        newLink2.attr("title", "Connect a " + whoValue + " by ID");

        const newLink3 = $(this).clone();
        newLink3.attr("href", href + "&WBEaction=Add");
        newLink3.text(addText);
        newLink3.attr("title", addTitle);
        $(this).after(newLink3);
        $(this).remove();
      }
    });
  }
}

function removeTurnOffPreviewLinks() {
  $("head").append("<style>#pausePagePreviewButton,#disablePagePreviewButton{display:none}</style>");
}

function addCategoryEditLinks() {
  if (isProfileEdit || isSpaceEdit || isCategoryEdit) {
    document.getElementById("wpSave").addEventListener("click", () => {
      setTimeout(() => {
        const errorList = document.querySelector("#validationRedErrorList ul");
        if (errorList != null) {
          const liTags = errorList.getElementsByTagName("li");
          for (let i = 0; i < liTags.length; i++) {
            if (liTags[i].innerText != null && liTags[i].innerText.includes('" does not exist')) {
              const liParts = liTags[i].innerText.split('"');
              const link =
                ' <a href="https://www.wikitree.com/index.php?title=Category:' +
                liParts[1] +
                '&action=edit"  class="new" >Category:' +
                liParts[1].replace("_", " ") +
                "</a> ";
              const leftPartWithoutTheWordCategory = liParts[0].substring(0, liParts[0].length - "Category ".length);
              const rightPart = liParts[2];
              $(liTags[i]).html(leftPartWithoutTheWordCategory + link + rightPart);
            }
          }
        }
      }, 1000);
    });
  }
}

function enhanceThonStats() {
  if (window.location.toString().includes("TeamAndUser.htm")) {
    const nameTDs = document.getElementsByClassName("level1 groupC groupL groupR groupT");
    const pointTDs = document.getElementsByClassName("level1 fieldC fieldR fieldT fieldB");
    const numMembersTD = document.getElementsByClassName("level2 fieldC fieldL fieldB");

    const points = [];
    const dict = {};
    let indexMembers = 0;

    for (let i = 0; i < nameTDs.length; i++) {
      const tdNode = nameTDs[i];
      const pointsForThisTeam = parseFloat(pointTDs[i].innerText.replace(".", "").replace(",", ""));

      let numberTeamMembers = 0;
      if (nameTDs[i].nextSibling.className == "level2 groupC groupL groupR groupT") {
        numberTeamMembers = 1;
      } else {
        numberTeamMembers = parseFloat(numMembersTD[indexMembers].innerText);
        indexMembers++;
      }

      let normalizedPoints = pointsForThisTeam / numberTeamMembers;
      normalizedPoints = Math.round(normalizedPoints * 100) / 100;

      while (normalizedPoints in dict) {
        if (normalizedPoints.toString().includes(".")) {
          normalizedPoints += "0";
        } else {
          normalizedPoints += ".0";
        }
      }
      dict[normalizedPoints] = tdNode.innerText;
      console.log(normalizedPoints + "=>" + tdNode.innerText);

      if (i > 0) {
        const pointsLastTeam = parseFloat(pointTDs[i - 1].innerText.replace(".", "").replace(",", ""));
        const diffToHigher = pointsLastTeam - pointsForThisTeam;
        tdNode.innerHTML += "<br>-" + diffToHigher;
      }

      if (i < nameTDs.length - 1) {
        const pointsNextTeam = parseFloat(pointTDs[i + 1].innerText.replace(".", "").replace(",", ""));
        const diffToLower = pointsForThisTeam - pointsNextTeam;
        tdNode.innerHTML += "<br>+" + diffToLower;
      }

      points[i] = normalizedPoints;
    }

    points.sort(function (a, b) {
      return b - a;
    });

    let pos = 1;

    let normalizedStats = "";
    for (let i = 0; i < points.length; i++) {
      normalizedStats += pos + ".  " + dict[points[i]] + ": " + roundIfNeeded(points[i]);
      if (i > 0) {
        const diffToHigher = points[i - 1] - points[i];
        normalizedStats += " -" + roundIfNeeded(diffToHigher) + "";
      }
      if (i < points.length - 1) {
        const diffToLower = points[i] - points[i + 1];
        normalizedStats += " +" + roundIfNeeded(diffToLower) + "";
      }
      normalizedStats += "\n";
      pos++;
    }

    const INDEX_NORMALIZED_COL = 1;
    const normalizedHeader = document.getElementsByClassName("fieldH")[INDEX_NORMALIZED_COL];
    const normalizedLink = document.createElement("a");
    normalizedLink.addEventListener("click", () => {
      alert(normalizedStats);
    });
    normalizedLink.innerText = normalizedHeader.innerText;
    normalizedHeader.innerHTML = "";
    normalizedHeader.appendChild(normalizedLink);
  }

  function roundIfNeeded(diffToLower) {
    return Math.round(diffToLower * 100) / 100;
  }
}

shouldInitializeFeature("usabilityTweaks").then((result) => {
  if (result) {
    getFeatureOptions("usabilityTweaks").then((options) => {
      window.usabilityTweaksOptions = options;

      // Add save form button
      if (isSearchPage && options.saveSearchFormDataButton) {
        addSaveSearchFormDataButton();
      }
      if ((isProfileAddRelative || isAddUnrelatedPerson) && options.saveSearchFormDataButton) {
        addUseSearchFormDataButton();
      }

      if (isSpecialMyConnections && options.useHeadlineAsTitle) {
        const h1 = document.getElementsByTagName("h1")[0];
        if (h1 != null && h1.innerText != null && h1.innerText.length > 0) {
          document.title = h1.innerText.trim();
        }
      }

      // Open Add/Remove/Replace links in the same tab
      if (isProfileEdit) {
        if (options.removeTargetsFromEditFamilyLinks) {
          $("a[href*='&who=']").attr("target", "_self");
        }

        if (options.andBetweenParentsExample) {
          //insert and between the parents in the example
          var allExamples = document.getElementsByClassName("EXAMPLE");
          if (allExamples[2].innerHTML != null && allExamples[2].innerHTML.search(/\]\] \[\[/) > -1) {
            allExamples[2].innerText = allExamples[2].innerHTML.replace("]] [[", "]] and [[").trim();
          }
        }
      }

      // Replace Add/Remove/Replace links with Add, Remove, Connect links
      if (options.addRemoveConnectLinks) {
        replaceAddRemoveReplaceLinks();
      }

      if (isProfileAddRelative && options.addRemoveConnectLinks) {
        /* On Add Person page, check the right radio button and maybe click the button.
      Don't click the button when who is child or spouse and WBEaction is Remove.
      */
        autoClickAddPersonOptions();
      }

      // focusFirstNameField
      if (options.focusFirstNameField) {
        putFocusOnFirstNameField();
      }

      if (isWikiEdit && options.rememberTextareaHeight) {
        triggerRememberTextareaHeight();
      }
      if (options.fixPrintingBug) {
        if (navigator.userAgent.indexOf("Windows NT 10.0") != -1) {
          $("body").addClass("w10");
        }
      }
      if (options.addScratchPadButton && isNavHomePage && $("#clonedScratchPadButton").length == 0) {
        addScratchPadButton();
      }
      if (options.onlyMembers && isSearchPage && $("#onlyMembers").length == 0) {
        onlyMembers();
      }
      if (options.removeMeButton && isProfilePage) {
        setTimeout(function () {
          addRemoveMeButton();
        }, 500);
      }
      if (options.removeMeButton && isSpecialTrustedList) {
        removeMe();
      }

      if (isSpaceEdit && options.leaveSpaceEditAfterSave) {
        forwardToSavedSpagePage();
      }

      if (options.removeDisablePreviewButtons) {
        removeTurnOffPreviewLinks();
      }

      if (options.categoryEditLinks) {
        addCategoryEditLinks();
      }

      if (isPlusDomain && options.enhanceThonPages) {
        enhanceThonStats();
      }
    }); //getFeatureOptions
  }
});

/**
 * Accepts URL parameters for private messages on profile pages
 * @function acceptPMs
 * @returns {void}
 * @example
 * acceptPMs();
 * @description
 * This function is called on profile pages to accept URL parameters for private messages.
 * It checks if the page is a profile page, gets the profile ID, and looks for a private message button.
 * If the URL has PMsubject and PMbody parameters, it fills in the subject and body of the private message.
 */
function acceptPMs() {
  if (isProfilePage) {
    const pageData = $("#pageData");
    const profileId = pageData.data("mid");
    let pmButtons = $(".privateMessageLink[data-who='" + profileId + "']");
    if (pmButtons.length == 0) {
      return;
    }
    const pmButton = pmButtons.eq(0);
    const params = new URLSearchParams(window.location.search);
    const PMsubject = params.get("PMsubject");
    const PMbody = params.get("PMbody");
    if (PMbody) {
      let targetNode = document.body; // Replace with a closer parent if possible

      // Options for the observer (which mutations to observe)
      let config = { childList: true, subtree: true };

      // Callback function to execute when mutations are observed
      let callback = function (mutationsList, observer) {
        for (let mutation of mutationsList) {
          // Check the addedNodes property
          for (let node of mutation.addedNodes) {
            // Use the instanceof operator to ensure the added node is an Element
            if (node instanceof Element) {
              // Check if our target element exists within this node
              let targetElement = node.querySelector("#privateMessage-comments");
              if (targetElement) {
                $("#privateMessage-comments").val(PMbody);
                $("#privateMessage-subject").val(PMsubject);
                observer.disconnect();
              }
            }
          }
        }
      };

      // Create an observer instance linked to the callback function
      let observer = new MutationObserver(callback);

      // Start observing the target node for configured mutations
      observer.observe(targetNode, config);
      pmButton[0].click();
    }
  }
}

setTimeout(acceptPMs, 1000);

/* Rangering */

// Define the class RangeringTool
class RangeringTool {
  constructor() {
    // Initialize variables
    this.people = null;
    this.bioCheckResults = {};
    this.fetchedProfiles = {};
    this.bioCheckResultsStorageKey = "bioCheckResults";
    this.fetchedProfilesStorageKey = "fetchedProfiles";

    this.init();
  }

  init() {
    // Initialize event listeners
    this.initializeEventListeners();

    // Check if pre1700=1 is in the URL
    if (window.location.href.includes("pre1700=1")) {
      this.markNewestPre1700People();
      this.addControlButtons();
    }

    // On page load, if we have people data in storage, display getBio buttons
    const storedProfiles = sessionStorage.getItem(this.fetchedProfilesStorageKey);
    if (storedProfiles) {
      this.fetchedProfiles = JSON.parse(storedProfiles);
      this.people = [null, null, this.fetchedProfiles];
      this.displayBioButtons();
    }
  }

  async getNewestPre1700People() {
    // Check if the list of pre-1700 profiles is already stored in localStorage
    const pre1700 = localStorage.getItem("pre1700");
    if (pre1700) {
      const pre1700Object = JSON.parse(pre1700);
      // If the list is less than a day old, use it
      if (new Date().getTime() - pre1700Object.timestamp < 86400000) {
        return pre1700Object.profileIDs;
      }
    }
    const profileIDs = [];
    // Get the page with the list of pre-1700 profiles
    const badgePage1 = await getWikiTreePage("Rangers", "index.php", "title=Special:Badges&b=pre_1700");
    console.log(badgePage1);
    // Make a DOM object of the page and find all the links like this: <span class="large"><a href="/wiki/Hill-64008" target="_blank">Sandy (Hill) McCartain</a></span>
    const badgePage1DOM = new DOMParser().parseFromString(badgePage1, "text/html");
    const links = badgePage1DOM.querySelectorAll("span.large a[href*='/wiki/']");
    // For each link, get the profile ID and add it to the list of profile IDs
    links.forEach((link) => {
      const profileID = link.href.split("/").pop();
      profileIDs.push(decodeURIComponent(profileID));
    });
    // Store them to localStorage with a timestamp
    localStorage.setItem("pre1700", JSON.stringify({ profileIDs: profileIDs, timestamp: new Date().getTime() }));

    return profileIDs;
  }

  async markNewestPre1700People() {
    const newestPre1700s = await this.getNewestPre1700People();
    const allLinks = document.querySelectorAll("a[href*='/wiki/']");
    allLinks.forEach((link) => {
      const profileID = link.href.split("/").pop();
      if (newestPre1700s.includes(profileID)) {
        $(link).addClass("newestPre1700s").attr("title", "One of the newest Pre-1700 badged people");
      }
    });
  }

  async getBios() {
    // Retrieve stored profiles and bio check results
    const storedProfiles = sessionStorage.getItem(this.fetchedProfilesStorageKey);
    this.fetchedProfiles = storedProfiles ? JSON.parse(storedProfiles) : {};

    const storedBioCheckResults = sessionStorage.getItem(this.bioCheckResultsStorageKey);
    this.bioCheckResults = storedBioCheckResults ? JSON.parse(storedBioCheckResults) : {};

    // Find all links in span.HISTORY-ITEM that include a year in the text content
    const theLinks = $("span.HISTORY-ITEM a");
    const bioLinks = [];

    // Collect profile IDs to fetch
    theLinks.each((index, element) => {
      if ($(element).text().match(/\d{4}/)) {
        const profileID = decodeURIComponent($(element).attr("href").split("/").pop());
        // If the profile is not already stored, add to bioLinks to fetch
        if (!this.fetchedProfiles[profileID]) {
          bioLinks.push(profileID);
        }
      }
    });

    if (bioLinks.length > 0) {
      // Fetch the bios using the WikiTreeAPI
      const peopleResponse = await WikiTreeAPI.getPeople(
        "Rangers",
        bioLinks,
        ["Id", "Name", "Bio", "BirthDate", "DeathDate", "Derived.ShortName"],
        { bioFormat: "text" }
      );

      // Merge the newly fetched bios into fetchedProfiles
      Object.assign(this.fetchedProfiles, peopleResponse[2]);

      // Store the updated profiles in sessionStorage
      sessionStorage.setItem(this.fetchedProfilesStorageKey, JSON.stringify(this.fetchedProfiles));

      // Update the 'people' variable
      this.people = [null, null, this.fetchedProfiles];

      // Process new profiles and run autoBioCheck
      Object.values(peopleResponse[2]).forEach((person) => {
        if (person && person.bio) {
          // Run autoBioCheck
          const autoBioCheckResult = this.autoBioCheck(person.bio);
          // Store the result
          this.bioCheckResults[person.Id] = autoBioCheckResult;
        }
      });

      // Update the bioCheckResults in sessionStorage
      sessionStorage.setItem(this.bioCheckResultsStorageKey, JSON.stringify(this.bioCheckResults));
    } else {
      // No new profiles to fetch
      if (!this.people) {
        // Use stored profiles
        this.people = [null, null, this.fetchedProfiles];
      }
    }

    // Display getBio buttons for all profiles
    this.displayBioButtons();
  }

  displayBioButtons() {
    // Find all links in span.HISTORY-ITEM that include a year in the text content
    const theLinks = $("span.HISTORY-ITEM a");

    // For each bio Name, find it in a link and add a button
    theLinks.each((index, element) => {
      if ($(element).text().match(/\d{4}/)) {
        const profileID = decodeURIComponent($(element).attr("href").split("/").pop());

        // Find the bio with the same Name as the profileID
        const person = Object.values(this.people[2]).find((person) => person.Name === profileID);

        if (person) {
          $("#mBirthDate").val(person.BirthDate || "0000-00-00");
          $("#mDeathDate").val(person.DeathDate || "0000-00-00");

          let autoBioCheckResult;
          if (this.bioCheckResults[person.Id] !== undefined) {
            // Use stored result
            autoBioCheckResult = this.bioCheckResults[person.Id];
          } else {
            // Run autoBioCheck
            autoBioCheckResult = this.autoBioCheck(person.bio);
            // Store the result
            this.bioCheckResults[person.Id] = autoBioCheckResult;
            // Update the bioCheckResults in sessionStorage
            sessionStorage.setItem(this.bioCheckResultsStorageKey, JSON.stringify(this.bioCheckResults));
          }

          // Prepend the button to the parent element
          const failedBioCheckClass = autoBioCheckResult === false ? " failedBioCheck" : "";
          const failedBioCheckTitle = autoBioCheckResult === false ? " Bio Check issues" : "";
          if ($(element).siblings(`button.getBio[data-id="${person.Id}"]`).length === 0) {
            $(element)
              .parent()
              .append(
                `<button class="getBio${failedBioCheckClass}" data-id="${String(
                  person.Id
                )}" title="${failedBioCheckTitle}">
                  ${person.ShortName || person.Name}
                </button>`
              );
          }
        }
      }
    });
  }

  // Function to escape HTML special characters
  escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Function to highlight WT markup elements
  highlightMarkup(text) {
    // Escape HTML characters
    let escapedText = this.escapeHtml(text);

    // Highlight headings (== Heading == to ===== Heading =====)
    escapedText = escapedText.replace(/(={2,5})([^=]+)\1/g, function (match, p1, p2) {
      var level = p1.length; // Heading level based on number of '='
      return '<span class="h' + level + '">' + match + "</span>";
    });

    // Highlight entire references and ref tags
    escapedText = escapedText.replace(
      /(&lt;ref\b[^&]*?&gt;)([\s\S]*?)(&lt;\/ref&gt;)|(&lt;ref\b[^&]*?\/&gt;)/gi,
      function (match, p1, p2, p3, p4) {
        if (p4) {
          // Self-closing tag
          return '<span class="reference"><span class="ref-tag">' + p4 + "</span></span>";
        } else {
          // Non-self-closing tag
          return (
            '<span class="reference"><span class="ref-tag">' +
            p1 +
            "</span>" +
            p2 +
            '<span class="ref-tag">' +
            p3 +
            "</span></span>"
          );
        }
      }
    );

    // Highlight lines starting with '*' in the '== Sources ==' section, including the '*'
    escapedText = escapedText.replace(
      /(<span class="h[2-5]">== Sources ==<\/span>)([\s\S]*?)(?=(<span class="h[2-5]">|$))/i,
      function (match, p1, p2) {
        // p1: '== Sources ==' heading
        // p2: Content after the heading up to the next heading or end of text
        // Process p2 to highlight lines starting with '*'
        let processedContent = p2.replace(/(^\*)(.*$)/gm, function (fullMatch, bullet, restOfLine) {
          return '<span class="source-line"><span class="bullet">' + bullet + "</span>" + restOfLine + "</span>";
        });
        return p1 + processedContent;
      }
    );

    // Return the processed text
    return escapedText;
  }

  // Event handler initialization
  initializeEventListeners() {
    // Event handler for clicking on .getBio buttons
    $(document).on("click", ".getBio", (event) => {
      event.stopPropagation(); // Prevent the document click handler from firing

      const bioId = String($(event.currentTarget).data("id")); // Ensure bioId is a string
      const thisPopup = $(`.bioPopup[data-id="${bioId}"]`);

      // Hide all .bioPopup elements except the current one
      $(".bioPopup").not(thisPopup).hide();

      if (thisPopup.length) {
        // Toggle visibility of the current popup
        thisPopup.toggle();
        return;
      }

      const bio = this.people[2][bioId]; // Access the bio using the string key
      if (bio && bio.bio) {
        const highlightedBio = this.highlightMarkup(bio.bio).replace(/\n/g, "<br>");
        $("#content").prepend(
          `<div class="bioPopup" data-id="${bioId}">
            <x class="closeBioPopup">&times;</x>
            ${highlightedBio}
          </div>`
        );
      }
    });

    // Close button handler
    $(document).on("click", ".closeBioPopup", function (event) {
      event.stopPropagation(); // Prevent the document click handler from firing
      $(this).parent().remove();
    });

    // Prevent clicks inside the popup from closing it
    $(document).on("click", ".bioPopup", function (event) {
      event.stopPropagation();
    });

    // Hide popups when clicking outside
    $(document).on("click", function () {
      $(".bioPopup").hide();
    });

    $(document).on("keydown", function (event) {
      if (event.key === "Escape") {
        $(".bioPopup").hide();
      }
    });
  }

  addControlButtons() {
    const onlyNewestBadgesButton = $(
      `<button id="onlyNewestBadges" title="Show only the 200 newest Pre-1700 badged people" class="button small">Only edits by newly-badged people</button>`
    );
    $("#content p:first").append(onlyNewestBadgesButton);
    $(document).on("click", "#onlyNewestBadges", function () {
      // Find all span.HISTORY-ITEM rows not containing links with the class newestPre1700s and toggle them
      const allItems = $("span.HISTORY-ITEM:not(.HISTORY-HIDDEN)");
      allItems.each(function () {
        if ($(this).find("a.newestPre1700s").length == 0) {
          $(this).toggle();
        }
      });
      $(this).toggleClass("active");
    });
    const getBiosButton = $(
      "<button id='getBios' title='Get the bios of all these profiles' class='button small'>Get bios</button>"
    );
    $(document).on("click", "#getBios", () => {
      this.getBios();
    });
    $("#content p:first").append(getBiosButton);
  }

  autoBioCheck(sourcesStr) {
    if ($("#mBirthDate").length == 0) {
      // Create hidden inputs to store the birthdate and death date
      $("body").append('<input type="hidden" id="mBirthDate" name="mBirthDate">');
      $("body").append('<input type="hidden" id="mDeathDate" name="mDeathDate">');
    }
    let thePerson = new BioCheckPerson();
    thePerson["#isApp"] = true;
    thePerson.build();
    let biography = new Biography(theSourceRules);
    biography.parse(sourcesStr, thePerson, "");
    biography.validate();
    const hasSources = biography.hasSources();
    return hasSources;
  }
}

const rangeringTool = new RangeringTool();
