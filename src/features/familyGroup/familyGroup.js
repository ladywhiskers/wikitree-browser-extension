/*
Created By: Ian Beacall (Beacall-6)
*/

import $ from "jquery";
import "jquery-ui/ui/widgets/draggable";
import { getRelatives } from "wikitree-js";
import { createProfileSubmenuLink, familyArray, isOK, htmlEntities, setAdjustedDates } from "../../core/common";
import { mainDomain, isSearchPage } from "../../core/pageType";

import { shouldInitializeFeature } from "../../core/options/options_storage";

shouldInitializeFeature("familyGroup").then((result) => {
  if (result && $("body.profile").length) {
    import("../familyTimeline/familyTimeline.css");
    // Add a link to the short list of links below the tabs
    const options = {
      title: "Display family group dates and locations",
      id: "familyGroupButton",
      text: "Family Group",
      url: "#n",
    };
    createProfileSubmenuLink(options);
    $("#" + options.id).on("click", function (e) {
      e.preventDefault();
      const profileID = $("a.pureCssMenui0 span.person").text();
      showFamilySheet($(this)[0], profileID);
    });

    // Get the position of an element
  }
});

export function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
  };
}

// Convert dates to ISO format (YYYY-MM-DD)
export function ymdFix(date) {
  let outDate;
  if (date == undefined || date == "") {
    outDate = "";
  } else {
    const dateBits1 = date.split(" ");
    if (dateBits1[2]) {
      const sMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const lMonths = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const dMonth = date.match(/[A-z]+/i);
      let dMonthNum;
      if (dMonth != null) {
        sMonths.forEach(function (aSM, i) {
          if (dMonth[0].toLowerCase() == aSM.toLowerCase() || dMonth[0].toLowerCase() == aSM + ".".toLowerCase()) {
            dMonthNum = (i + 1).toString().padStart(2, "0");
          }
        });
      }
      const dDate = date.match(/\b[0-9]{1,2}\b/);
      const dDateNum = dDate[0];
      const dYear = date.match(/\b[0-9]{4}\b/);
      const dYearNum = dYear[0];
      return dYearNum + "-" + dMonthNum + "-" + dDateNum;
    } else {
      const dateBits = date.split("-");
      outDate = date;
      if (dateBits[1] == "00" && dateBits[2] == "00") {
        if (dateBits[0] == "0000") {
          outDate = "";
        } else {
          outDate = dateBits[0];
        }
      }
    }
  }
  return outDate;
}

let zIndexCounter = 1000; // Initial z-index value

export function incrementZIndex(jqObject) {
  zIndexCounter++;
  jqObject.css("z-index", zIndexCounter);
}

export function getHighestZindex() {
  let highest = 0;
  $("*").each(function () {
    const current = parseInt($(this).css("z-index"), 10);
    if (current && highest < current) highest = current;
  });
  return highest;
}

export async function showFamilySheet(theClicked, profileID) {
  // Event delegation for closing and wrapping
  $(document)
    .off("click.wbe")
    .on("click.wbe", ".familySheet x", function () {
      $(this).parent().fadeOut();
    });

  $(document).on("click.wbe", ".familySheet w", function () {
    $(this).parent().toggleClass("wrap");
  });

  $(document)
    .off("dblclick.wbe")
    .on("dblclick.wbe", ".familySheet", function () {
      $(this).fadeOut();
      incrementZIndex($(this));
    });
  // If the table already exists toggle it.
  if ($("#" + createValidId(profileID.replace(" ", "_")) + "_family").length) {
    const thisFamilySheet = $("#" + createValidId(profileID.replace(" ", "_")) + "_family");
    thisFamilySheet.fadeToggle();
    thisFamilySheet.css("z-index", getHighestZindex() + 1);
  } else {
    // Make the table and do other things
    getRelatives(
      [profileID],
      {
        getParents: true,
        getSiblings: true,
        getSpouses: true,
        getChildren: true,
      },
      { appId: "WBE_familyGroup" }
    ).then((person) => {
      const uPeople = familyArray(person[0]);
      // Make the table
      const familyTable = peopleToTable(uPeople);
      // Attach the table to the body, position it and make it draggable and toggleable
      familyTable.prependTo("body");
      familyTable.attr("id", createValidId(profileID.replace(" ", "_")) + "_family");
      familyTable.draggable();
      familyTable.fadeIn();
      incrementZIndex(familyTable);
      familyTable.css("z-index", getHighestZindex() + 1);

      let theLeft;

      if ($("div.ten.columns").length && !isSearchPage) {
        theLeft = getOffset($("div.ten.columns")[0]).left;
        familyTable.css({
          top: getOffset(theClicked).top + 50,
          left: theLeft,
        });
      } else {
        theLeft = getOffset(theClicked[0]).left + 50;
        familyTable.css({
          top: getOffset(theClicked[0]).top + 50,
          left: theLeft,
        });
      }

      // Adjust the position of the table on window resize
      $(window).on("resize", function () {
        if (familyTable.length) {
          let theLeft;
          if ($("div.ten.columns").length) {
            theLeft = getOffset($("div.ten.columns")[0]).left;
            familyTable.css({
              top: getOffset(theClicked).top + 50,
              left: theLeft,
            });
          } else {
            theLeft = getOffset(theClicked[0]).left + 50;
            familyTable.css({
              top: getOffset(theClicked[0]).top + 50,
              left: theLeft,
            });
          }
        }
      });
    });
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function peopleToTable(kPeople) {
  const kTable = $(
    "<div class='familySheet'><w>↔</w><x>x</x><table><caption></caption><thead><tr><th>Relation</th><th>Name</th><th>Birth Date</th><th>Birth Place</th><th>Death Date</th><th>Death Place</th></tr></thead><tbody></tbody></table></div>"
  );
  kPeople.forEach(function (kPers) {
    if (kPers) {
      setAdjustedDates(kPers);
      let rClass = "";
      kPers.RelationShow = kPers.Relation;
      if (kPers.Relation == undefined || kPers.Active) {
        kPers.Relation = "Sibling";
        kPers.RelationShow = "";
        rClass = "self";
      }

      const bDate = kPers.adjustedBirth;
      const dDate = kPers.adjustedDeath;

      if (kPers.BirthLocation == null || kPers.BirthLocation == undefined) {
        kPers.BirthLocation = "";
      }

      if (kPers.DeathLocation == null || kPers.DeathLocation == undefined) {
        kPers.DeathLocation = "";
      }

      if (kPers.MiddleName == null) {
        kPers.MiddleName = "";
      }
      let oName = displayName(kPers)[0];

      if (kPers.Relation) {
        // The relation is stored as "Parents", "Spouses", etc., so...
        kPers.Relation = kPers.Relation.replace(/s$/, "").replace(/ren$/, "");
        if (rClass != "self") {
          kPers.RelationShow = kPers.Relation;
        }
      }
      if (oName) {
        const aLine = $(
          "<tr data-name='" +
            escapeHtml(kPers.Name) +
            "' data-birthdate='" +
            bDate.date.replaceAll(/-/g, "") +
            "' data-relation='" +
            escapeHtml(kPers.Relation) +
            "' class='" +
            rClass +
            " " +
            escapeHtml(kPers.Gender) +
            "'><td>" +
            escapeHtml(kPers.RelationShow) +
            "</td><td><a href='https://" +
            mainDomain +
            "/wiki/" +
            htmlEntities(kPers.Name) +
            "'>" +
            escapeHtml(oName) +
            "</td><td class='aDate'>" +
            escapeHtml(bDate.display) +
            "</td><td>" +
            escapeHtml(kPers.BirthLocation) +
            "</td><td class='aDate'>" +
            escapeHtml(dDate.display) +
            "</td><td>" +
            escapeHtml(kPers.DeathLocation) +
            "</td></tr>"
        );

        kTable.find("tbody").append(aLine);
      }
    }

    if (kPers.Relation == "Spouse") {
      let marriageDeets = "m.";
      const dMdate = ymdFix(kPers.marriage_date);
      if (dMdate != "") {
        marriageDeets += " " + dMdate;
      }
      if (isOK(kPers.marriage_location)) {
        marriageDeets += " " + kPers.marriage_location;
      }
      if (marriageDeets != "m.") {
        let kGender;
        if (kPers.DataStatus.Gender == "blank") {
          kGender = "";
        } else {
          kGender = kPers.Gender;
        }
        const spouseLine = $(
          "<tr class='marriageRow " +
            escapeHtml(kGender) +
            "' data-spouse='" +
            escapeHtml(kPers.Name) +
            "'><td>&nbsp;</td><td colspan='3'>" +
            escapeHtml(marriageDeets) +
            "</td><td></td><td></td></tr>"
        );
        kTable.find("tbody").append(spouseLine);
      }
    }
  });
  const rows = kTable.find("tbody tr");
  rows.sort((a, b) => ($(b).data("birthdate") < $(a).data("birthdate") ? 1 : -1));
  kTable.find("tbody").append(rows);

  const familyOrder = ["Parent", "Sibling", "Spouse", "Child"];
  familyOrder.forEach(function (relWord) {
    kTable.find("tr[data-relation='" + escapeHtml(relWord) + "']").each(function () {
      $(this).appendTo(kTable.find("tbody"));
    });
  });

  kTable.find(".marriageRow").each(function () {
    $(this).insertAfter(kTable.find("tr[data-name='" + createValidId($(this).data("spouse")) + "']"));
  });

  return kTable;
}

function createValidId(unsafe) {
  return unsafe.replace(/[^a-zA-Z0-9-_]/g, "_");
}

// Find good names to display (as the API doesn't return the same fields all profiles)
export function displayName(fPerson) {
  if (fPerson != undefined) {
    let fName1 = "";
    if (typeof fPerson["LongName"] != "undefined") {
      if (fPerson["LongName"] != "") {
        fName1 = fPerson["LongName"].replace(/\s\s/, " ");
      }
    }
    let fName2 = "";
    let fName4 = "";
    if (typeof fPerson["MiddleName"] != "undefined") {
      if (fPerson["MiddleName"] == "" && typeof fPerson["LongNamePrivate"] != "undefined") {
        if (fPerson["LongNamePrivate"] != "") {
          fName2 = fPerson["LongNamePrivate"].replace(/\s\s/, " ");
        }
      }
    } else {
      if (typeof fPerson["LongNamePrivate"] != "undefined") {
        if (fPerson["LongNamePrivate"] != "") {
          fName4 = fPerson["LongNamePrivate"].replace(/\s\s/, " ");
        }
      }
    }

    let fName3 = "";
    const checks = ["Prefix", "FirstName", "RealName", "MiddleName", "LastNameAtBirth", "LastNameCurrent", "Suffix"];
    checks.forEach(function (dCheck) {
      if (typeof fPerson["" + dCheck + ""] != "undefined") {
        if (fPerson["" + dCheck + ""] != "" && fPerson["" + dCheck + ""] != null) {
          if (dCheck == "LastNameAtBirth") {
            if (fPerson["LastNameAtBirth"] != fPerson.LastNameCurrent) {
              fName3 += "(" + fPerson["LastNameAtBirth"] + ") ";
            }
          } else if (dCheck == "RealName") {
            if (!(typeof fPerson["FirstName"] != "undefined")) {
              fName3 += fPerson["RealName"] + " ";
            }
          } else {
            fName3 += fPerson["" + dCheck + ""] + " ";
          }
        }
      }
    });

    const arr = [fName1, fName2, fName3, fName4];
    var longest = arr.reduce(function (a, b) {
      return a.length > b.length ? a : b;
    });

    const fName = longest;

    let sName;
    if (fPerson["ShortName"]) {
      sName = fPerson["ShortName"];
    } else {
      sName = fName;
    }
    // fName = full name; sName = short name
    return [fName.trim(), sName.trim()];
  }
}
