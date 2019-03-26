/*
Commonly used helper functions
Include this file seperately where the utility functions are required

*/

(function ($) {
	//http://john-sheehan.com/blog/updated-webforms-custom-selector-for-jquery-13/
	//$(":asp('TextBox1')").show();
	String.prototype.endsWith = function (str) {
		return (this.match(str + '$') == str)
	}

	jQuery.expr[":"].asp = function (a, i, m) {
		return (id = jQuery(a).prop('id')) && id.endsWith(m[3]);
	};

	//reset form
	// Credit: http://www.learningjquery.com/2007/08/clearing-form-data
	// Resets all form elements
	$.fn.clearForm = function () {
		return this.each(function () {
			var type = this.type, tag = this.tagName.toLowerCase();
			if (tag == 'form')
				return $(':input', this).clearForm();
			if (type == 'text' || type == 'password' || tag == 'textarea')
				this.value = '';
			else if (type == 'checkbox' || type == 'radio')
				this.checked = false;
			else if (tag == 'select')
				this.selectedIndex = -1;
		});
	};

	$.extend({
		getUrlVars: function () {
			var vars = [], hash;
			var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
			for (var i = 0; i < hashes.length; i++) {
				hash = hashes[i].split('=');
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
			}
			return vars;
		},
		getUrlVar: function (name) {
			return $.getUrlVars()[name];
		}
	});

    //Define window.onerror handler function to send errors back to server
	var errorLogging = true;
	var sentErrors = [];
    
	if (errorLogging) {
	    window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
            
            //Send the error if not already spent (prevents repeat messages spamming server)
	        if (!sentErrors.includes(errorMsg)) {
	            var applicationErrorsDTO = {
	                ErrorMessage: '"' + errorMsg + '"',
	                StackTrace: '"' + errorObj.stack + '"',
	                LineNumber: '"' + lineNumber + '"',
	                CharacterNumber: '"' + column + '"',
	                URL: '"' + window.location.href + '"',
	                UserID: '"' + GetUserID() + '"',
	                PracticeID: '"' + GetPracticeID() + '"'
	            };
            
	            sentErrors.push(errorMsg);
	            postErrorToServerCSV(applicationErrorsDTO);
	        }
		}
	}

	PEMR_InitializeTokenAuthentication();

    //test error logging
	//setTimeout(function () {
	//    throw new Error('Error catching unit test');
	//}, 5000);

})(jQuery);

function IsMobileDevice() {
	return /Android|iPhone|iPad/i.test(navigator.userAgent);
}

function GetPatientId() {
	var pid = $.getUrlVar('PatientID');
	if (pid == null || pid == undefined || pid == '') { return null; }
	// If the URL is appended with #, remove that to get the correct patient id
	pid = pid.split('#')[0];
	if (pid == '' || pid == null) {
		alert('Invalid patient');
		return false;
	}
	return pid;
}

function GetUserID() {
    var userid;
	
    //Attempt to get user id from global variable or hidden field
	if (typeof CURRENT_USER_ID != "undefined" && CURRENT_USER_ID != null)
	    userid = CURRENT_USER_ID;
    else
	    userid = $('input[id$="HiddenUserID"]').val();

	return userid;
}
// Getting Patient Gender from PDG_GO Global Variable, if it is undefined or 
// PDG_GO.PatientDetails.Gender is null/empty/undefined then 
// getting gender value from Patient Encounter Page Header section.
function GetPatientGender() {
	var vPatientGender = null;
	try {
		if (PJSON.IsNullOrEmptyOrUndefinedString(PDG_GO.PatientDetails.Gender) == false) {
			vPatientGender = PDG_GO.PatientDetails.Gender;
		}
		else {
			vPatientGender = PGenderType.Convert($('#vHeaderPatientGender').html());
		}
	} catch (ex) {
		vPatientGender = PGenderType.Convert($('#vHeaderPatientGender').html());
	}
	return vPatientGender;
}
// Use this function to delete and array element
// Call it with
// myArray.remove(3, 1) - to remove 1 element at index 3
// myArray.remove(5,2) - to remove 2 elements from index 5
//Array.prototype.remove = function(from, count)
//{
//    return this.splice(from, to);
//};


//===[ getUrlParamValue ]=======================================================
// Desc : This function is used to retrieve the query-param value within url
// Syntax - Get : var <vParamValue> = $.getUrlParamValue('<ParamName>');
// Example : If page url is
//           http://localhost:2238/PatientRegister/PatientQuickAdd.aspx
//           ?iPatientID=4a77515d-f938-4250-9bb9-edc8a67be407
//           var vPatientID = $.getUrlParamValue('iPatientID');
//           alert(vPatientID);
// Output  : 4a77515d-f938-4250-9bb9-edc8a67be407
//==============================================================================
$.extend({
	getUrlParams: function () {
		var vars = [], hash;
		var pString = window.location.href;

		//Take the href content starting from '?'
		pString = pString.slice(pString.indexOf('?') + 1);

		//Trim the href content after # - this might come in case tabs are used
		if (pString.indexOf('#') > -1) {
			pString = pString.substring(0, pString.lastIndexOf('#'));
		}

		//Now split the query string into the params
		var hashes = pString.split('&');
		for (var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},
	getUrlParamValue: function (paramName) {
		return $.getUrlParams()[paramName];
	}
});


//===[ jQGetDateTimeString ]====================================================
// Desc : Return the date|date-time string in the required format
// Note : If any other format required, they can be added based on requirement
// Syntax - Get : var <newVar> = jQGetDateTimeString('<dateFormat>', '<dateString>');
// Example : var vDate = jQGetDateTimeString('m/d/yy', 'today')
// Output  : Will return todays date in '7/21/2011' format
//==============================================================================
function jQGetDateTimeString(dateFormat, dateString) {
	//Validate date string
	//Note: dateString format '3/31/2011 12:00:00 am'
	if (typeof (dateString) != 'string') {
		if (typeof (dateString) == 'object' && dateString != null && typeof (dateString.toString) != 'undefined') {
			dateString = dateString.toString();
		}
		else {
			return null;
		}
	}

	if (dateString == 'today') dateString = (new Date()).toString();
	var dateObj = new Date(dateString);
	if (dateString == '' || (dateObj == 'Invalid Date')) return null;
	var day = dateObj.getDate();
	var month = dateObj.getMonth() + 1;
	var year = dateObj.getFullYear();

	try {
		switch (dateFormat) {
			case 'yy-mm-dd':
				return $.datepicker.formatDate('yy-mm-dd', new Date(dateString));
			case 'MON d,yy':
				return $.datepicker.formatDate('M d, yy', new Date(dateString));
			case 'm/d/yy':
				return $.datepicker.formatDate('m/d/yy', new Date(dateString));
			case 'mm/dd/yy':
				day = day < 10 ? "0" + day.toString() : day.toString();
				month = month < 10 ? "0" + month.toString() : month.toString();
				var newDate = "01/01/1753";
				//To avoid saving errors, forming date string only for year > 1753
				//because sql server minimum value for datetime datatype is 01/01/1753 
				if (year > 1753) {
					newDate = month + "/" + day + "/" + year;
				}
				return newDate;
			case 'm/d/yy default12hms':
				return $.datepicker.formatDate('m/d/yy', new Date(dateString))
					+ ' 12:00:00 am';
			case 'mm/dd/yy default24hms':
				return $.datepicker.formatDate('mm/dd/yy', new Date(dateString))
					+ ' 00:00:00';
			case 'm/d/yy default24hms':
				var givenDate = new Date(dateString);
				return $.datepicker.formatDate('m/d/yy', new Date(dateString))
					+ ' ' + givenDate.getHours() + ':' + givenDate.getMinutes() + ':' + givenDate.getSeconds();
			case 'mm/dd/yy 12hm':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12) ? givenDate.getHours() - 12 : (givenDate.getHours() == 0) ? '12' : givenDate.getHours();
				return $.datepicker.formatDate('mm/dd/yy', givenDate)
					+ ' ' + hrs
					+ ':' + givenDate.getMinutes()
					+ ' ' + apm;
			case 'mm/dd/yy 12hhmm':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12)
					? givenDate.getHours() - 12 : (givenDate.getHours() == 0)
					? '12' : givenDate.getHours();
				var min = givenDate.getMinutes();

				var strH = (parseInt(hrs, 10) < 10) ? '0' + hrs.toString() : hrs.toString();
				var strM = (parseInt(min, 10) < 10) ? '0' + min.toString() : min.toString();

				return $.datepicker.formatDate('mm/dd/yy', givenDate)
					+ ' ' + strH
					+ ':' + strM
					+ ' ' + apm;
			case 'mm/dd/yy 12hhmmss':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12)
					? givenDate.getHours() - 12 : (givenDate.getHours() == 0)
					? '12' : givenDate.getHours();
				var min = givenDate.getMinutes();
				var sec = givenDate.getSeconds();

				var strH = (parseInt(hrs, 10) < 10) ? '0' + hrs.toString() : hrs.toString();
				var strM = (parseInt(min, 10) < 10) ? '0' + min.toString() : min.toString();
				var strS = (parseInt(sec, 10) < 10) ? '0' + sec.toString() : sec.toString();

				return $.datepicker.formatDate('mm/dd/yy', givenDate)
					+ ' ' + strH
					+ ':' + strM
					+ ':' + strS
					+ ' ' + apm;
			case 'm/d/yy 12hhmm':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12)
					? givenDate.getHours() - 12 : (givenDate.getHours() == 0)
					? '12' : givenDate.getHours();
				var min = givenDate.getMinutes();

				var strH = (parseInt(hrs, 10) < 10) ? '0' + hrs.toString() : hrs.toString();
				var strM = (parseInt(min, 10) < 10) ? '0' + min.toString() : min.toString();

				return $.datepicker.formatDate('m/d/yy', givenDate)
					+ ' ' + strH
					+ ':' + strM
					+ ' ' + apm;

			case 'm/d/yy 12hm':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12) ? givenDate.getHours() - 12 : (givenDate.getHours() == 0) ? '12' : givenDate.getHours();
				return $.datepicker.formatDate('m/d/yy', givenDate)
					+ ' ' + hrs
					+ ':' + givenDate.getMinutes()
					+ ' ' + apm;
			case 'm/d/yy 24hm':
				var givenDate = new Date(dateString);
				return $.datepicker.formatDate('m/d/yy', givenDate)
					+ ' ' + givenDate.getHours()
					+ ':' + givenDate.getMinutes();
			case 'm/d/yy 12hms':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12) ? givenDate.getHours() - 12 : (givenDate.getHours() == 0) ? '12' : givenDate.getHours();
				return $.datepicker.formatDate('m/d/yy', givenDate)
					+ ' ' + hrs
					+ ':' + givenDate.getMinutes()
					+ ':' + +givenDate.getSeconds()
					+ ' ' + apm;
			case 'mm/dd/yy 12hms':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12) ? givenDate.getHours() - 12 : (givenDate.getHours() == 0) ? '12' : givenDate.getHours();
				return $.datepicker.formatDate('mm/dd/yy', givenDate)
					+ ' ' + hrs
					+ ':' + givenDate.getMinutes()
					+ ':' + +givenDate.getSeconds()
					+ ' ' + apm;
			case 'm/d/yy 24hms':
				var givenDate = new Date(dateString);
				return $.datepicker.formatDate('m/d/yy', givenDate)
					+ ' ' + givenDate.getHours()
					+ ':' + givenDate.getMinutes()
					+ ':' + +givenDate.getSeconds();
			case '12hhmm':
				var givenDate = new Date(dateString);
				var apm = (givenDate.getHours() < 12) ? 'AM' : 'PM';
				var hrs = (givenDate.getHours() > 12)
					? givenDate.getHours() - 12 : (givenDate.getHours() == 0)
					? '12' : givenDate.getHours();
				var min = givenDate.getMinutes();
				var strH = (parseInt(hrs, 10) < 10) ? '0' + hrs.toString() : hrs.toString();
				var strM = (parseInt(min, 10) < 10) ? '0' + min.toString() : min.toString();
				return strH + ':' + strM + ' ' + apm;
			case 'yyyy-mm-dd hh:mm:ss.ms':
				var currentdateValue = new Date();
				var yearValue = currentdateValue.getFullYear();
				var monthValue = currentdateValue.getMonth() + 1;
				if (monthValue < 10) monthValue = '0' + monthValue;
				var dayValue = currentdateValue.getDate();
				if (dayValue < 10) dayValue = '0' + dayValue;
				var hoursValue = currentdateValue.getHours();
				if (hoursValue < 10) hoursValue = '0' + hoursValue;
				var minutesValue = currentdateValue.getMinutes();
				if (minutesValue < 10) minutesValue = '0' + minutesValue;
				var secondsValue = currentdateValue.getSeconds();
				if (secondsValue < 10) secondsValue = '0' + secondsValue;
				var millisecondsValue = currentdateValue.getMilliseconds();
				// yyyy-mm-dd hh:mm:ss.ms
				return (yearValue + '-' + monthValue + '-' + dayValue + ' ' + hoursValue + ':' + minutesValue + ':' + secondsValue + '.' + millisecondsValue);
			default:
				return null;
		}
	}
	catch (ex) {
		return null;
	}
}


//===[ jQGetFourRandomDigits ]==================================================
// Desc : To randomly generate 4 digit combination.
// Note : This function is only for use with-in 'jQGenerateNewGuid'.
//==============================================================================
function jQGetFourRandomDigits() {
	return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}


//===[ jQGenerateNewGuid ]======================================================
// Desc    : This function randomly generates New Guid.
// Note-01 : The GUID generated from this may not be unique,
//           hence avoid using(saving) the same in server-side code.
// Note-02 : At client-side to make sure the Guid is unique,
//           use 'jQGenerateNewGuidNotInArray' function.
// Syntax  : var <guidVar> = jQGenerateNewGuid();
// Example : var vNewGuid = jQGenerateNewGuid();
//           alert(vNewGuid);
// Output  : '4a77515d-f938-4250-9bb9-edc8a67be407' (For example only)
//==============================================================================
function jQGenerateNewGuid() {
	//return (jQGetFourRandomDigits()
	//	+ jQGetFourRandomDigits()
	//	+ '-'
	//	+ jQGetFourRandomDigits()
	//	+ '-'
	//	+ jQGetFourRandomDigits()
	//	+ '-'
	//	+ jQGetFourRandomDigits()
	//	+ '-'
	//	+ jQGetFourRandomDigits()
	//	+ jQGetFourRandomDigits()
	//	+ jQGetFourRandomDigits()
	//);
	return Math.uuid();
}


//===[ jQGenerateNewGuidNotInArray ]============================================
// Desc    : This function returns randomly generated New Guid which does not
//           exist in the Guid Array provided as an input.
// Syntax  : var <jQGenerateNewGuidNotInArray> = jQGenerateNewGuid();
//==============================================================================
function jQGenerateNewGuidNotInArray(guidArray) {
	var bContinue = true;
	var bIDFound = false;
	var newGuid = null;

	while (bContinue) {
		newGuid = jQGenerateNewGuid();
		bIDFound = false;
		$.each(guidArray, function (gIndex, gObject) {
			if (gObject == newGuid) { bIDFound = true; }
		});
		bContinue = bIDFound;
	}
	return newGuid;
}


//===[ PEMR_SetPrintingButtonStatus ]===========================================
// Desc    : This function is used to set the progress icon in the button
//           only if the following notes are implemented
//------------------------------------------------------------------------------
// Note-01 : For button the primary icon only must be set.
// Note-02 : The icom should be '.ui-icon-print'
//------------------------------------------------------------------------------
// Syntax  : PEMR_SetPrintingButtonStatus(<controlNameWithHash>, true/false, 'Print/Printing...');
// Example : PEMR_SetPrintingButtonStatus('#PrintButtonName', true, 'Printing..');
//==============================================================================
function PEMR_SetPrintingButtonStatus(controlNameWithHash, isPrinting, buttonCaption) {
	if (isPrinting == true) {
		$(controlNameWithHash).button({ label: buttonCaption });
		$(controlNameWithHash).find('.ui-icon-print').hide();
		$(controlNameWithHash).append('<img class="smallprogresslogo" src="../img/smallprogresslogo.gif" style="position:absolute; top:2px; left:5px;" />');
	}
	else {
		$(controlNameWithHash).button({ label: buttonCaption });
		$(controlNameWithHash).find('.ui-icon-print').show();
		$(controlNameWithHash).find('.smallprogresslogo').remove();
	}
}


//========[PEMR_ColorType]======================================================
// Desc    : Use this function to access standard color types
// Syntax  : var <colorObject> = new PEMR_ColorType();
//==============================================================================
function PEMR_ColorType() {
	//=====[Properties]=====
	//-----[Mono]-----
	//Standard Colors
	this.Black = '#000000';
	this.White = '#FFFFFF';
	//Gray Shades
	this.LightGrayL00 = '#000000';
	this.LightGrayL10 = '#111111';
	this.LightGrayL20 = '#222222';
	this.LightGrayL30 = '#333333';
	this.LightGrayL40 = '#444444';
	this.LightGrayL50 = '#555555';
	this.LightGrayL60 = '#666666';
	this.LightGrayL70 = '#777777';
	this.LightGrayL80 = '#888888';
	this.LightGrayL90 = '#999999';
	this.LightGrayLA0 = '#AAAAAA';
	this.LightGrayLB0 = '#BBBBBB';
	this.LightGrayLC0 = '#CCCCCC';
	this.LightGrayLD0 = '#DDDDDD';
	this.LightGrayLE0 = '#EEEEEE';
	this.LightGrayLF0 = '#FFFFFF';

	//-----[Color]-----
	//Standard Colors
	this.Red = '#FF0000';
	this.Green = '#00FF00';
	this.Blue = '#0000FF';
	this.CCRed = '#CC0000';
	this.CCGreen = '#00CC00';
	this.CCBlue = '#0000CC';
	//Color Shades= Palette01 - Background Shades for notifications
	this.Palette01_Yellow = '#FFFFCC';
	this.Palette01_Orange = '#FFEECC';
	this.Palette01_Green = '#ECFFC4';
	// User can not deafferenting the "associated Service-code is not authorized" status message and "save error" status message. 
	// why because those two status message background color is same.
	// So Added below background color for "save error" message then user can easily identify.
	this.Palette01_karry = '#FBDDC2';

	//-----[Methods]-----
	//this.Convert = function (pValue) { } //Not-required
	//this.GetPropertyName = function (pValue) { } //Not-required
	//this.GetOptionHtml = function () { } //Not-required
};
var PColorType = new PEMR_ColorType();


//========[PEMR_MessageType]====================================================
// Desc    : Use this function to access standard status message types
// Syntax  : var <messageObject> = new PEMR_MessageType();
//==============================================================================
function PEMR_MessageType() {
	//=====[Properties]=====
	this.Notification = 'notification';
	this.Success = 'success';
	this.Error = 'error';
	this.DefaultValue = this.Notification

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toLowerCase();
			if (pValue == this.Notification || pValue == this.Success || pValue == this.Error) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required
	//this.GetOptionHtml = function () { } //Not-required
}
var PMessageType = new PEMR_MessageType();


//========[PEMR_OpModeType]=====================================================
// Desc    : Use this function to access standard operation modes
// Syntax  : var <opModeObject> = new PEMR_OpModeType();
//==============================================================================
function PEMR_OpModeType() {
	//=====[Properties]=====
	this.Add = 'add';
	this.Edit = 'edit';
	this.Delete = 'delete';
	this.Reset = 'reset';
	this.Copy = 'copy';
	this.Import = 'import';
	this.Export = 'export';
	this.Load = 'load';
	this.Refresh = 'refresh';
	this.None = 'none';
	this.Transform = 'transform';
	this.DefaultValue = this.None;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toLowerCase();
			if (pValue == this.Add || pValue == this.Edit || pValue == this.Delete
				|| pValue == this.Reset || pValue == this.Copy || pValue == this.Import
				|| pValue == this.Export || pValue == this.Load || pValue == this.Refresh
				|| pValue == this.None || pValue == this.Transform) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required
	//this.GetOptionHtml = function () { } //Not-required
};
var POpModeType = new PEMR_OpModeType();


//========[PEMR_CriteriaType]=====================================================
// Desc    : Use this function to access standard criterias
// Syntax  : var <ctObject> = new PEMR_CriteriaType();
//==============================================================================
function PEMR_CriteriaType() {
	//=====[Properties]=====
	this.Equal = 'EQ';
	this.GreaterThan = 'GT';
	this.GreaterThanEQualto = 'GTEQ';
	this.LesserThan = 'LT';
	this.LesserThanEQualto = 'LTEQ';
	this.NotEqual = 'NEQ';
	this.Between = 'BTW';
	this.DefaultValue = this.Equal;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toUpperCase();
			if (pValue == this.Equal || pValue == this.GreaterThan || pValue == this.GreaterThanEQualto
				|| pValue == this.LesserThan || pValue == this.LesserThanEQualto || pValue == this.NotEqual
				|| pValue == this.Between) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'Equal';
		switch (pValue) {
			case this.Equal: retValue = '='; break;
			case this.GreaterThan: retValue = '>'; break;
			case this.GreaterThanEQualto: retValue = '>='; break;
			case this.LesserThan: retValue = '<'; break;
			case this.LesserThanEQualto: retValue = '<='; break;
			case this.NotEqual: retValue = '!='; break;
			case this.Between: retValue = 'Between'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="EQ">=</option>'
			+ '<option value="GT">&gt;</option>'
			+ '<option value="GTEQ">&gt;=</option>'
			+ '<option value="LT">&lt;</option>'
			+ '<option value="LTEQ">&lt;=</option>'
			+ '<option value="NEQ">!=</option>'
			+ '<option value="BTW">Between</option>';
	}
}
var PCriteriaType = new PEMR_CriteriaType();


//========[PEMR_AgeUnitType]=====================================================
// Desc    : Use this function to access standard age units
// Syntax  : var <auObject> = new PEMR_AgeUnitType();
//==============================================================================
function PEMR_AgeUnitType() {
	//=====[Properties]=====
	this.Days = 'D';
	this.Months = 'M';
	this.Years = 'Y';
	this.DefaultValue = this.Days;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toUpperCase();
			if (pValue == this.Days || pValue == this.Months || pValue == this.Years) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'Days';
		switch (pValue) {
			case this.Days: retValue = 'Days'; break;
			case this.Months: retValue = 'Months'; break;
			case this.Years: retValue = 'Years'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="D">Days</option>'
			+ '<option value="M">Months</option>'
			+ '<option value="Y">Years</option>';
	}
}
var PAgeUnitType = new PEMR_AgeUnitType();


//========[PEMR_GenderType]=====================================================
// Desc    : Use this function to access standard gender types
// Syntax  : var <gtObject> = new PEMR_GenderType();
//==============================================================================
function PEMR_GenderType() {
	//=====[Properties]=====
	this.Male = 'M';
	this.Female = 'F';
	this.Unknown = 'U';
	this.All = 'A';
	this.DefaultValue = this.Unknown;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toUpperCase();
			if (pValue == this.Male || pValue == this.Female || pValue == this.Unknown
				|| pValue == this.All) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'Unknown';
		switch (pValue) {
			case this.Male: retValue = 'Male'; break;
			case this.Female: retValue = 'Female'; break;
			case this.Unknown: retValue = 'Unknown'; break;
			case this.All: retValue = 'All'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="U">Unknown</option>'
			+ '<option value="M">Male</option>'
			+ '<option value="F">Female</option>'
			+ '<option value="A">All</option>';
	}
}
var PGenderType = new PEMR_GenderType();


//========[PEMR_ConditionType]==================================================
// Desc    : Use this function to access standard condition types
// Syntax  : var <ctObject> = new PEMR_ConditionType();
//==============================================================================
function PEMR_ConditionType() {
	//=====[Properties]=====
	this.And = 'A';
	this.Or = 'O';
	this.DefaultValue = this.And;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toUpperCase();
			if (pValue == this.And || pValue == this.Or) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'And';
		switch (pValue) {
			case this.And: retValue = 'And'; break;
			case this.Or: retValue = 'Or'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="A">And</option>'
			+ '<option value="O">Or</option>';
	}
}
var PConditionType = new PEMR_ConditionType();


//========[PEMR_TimeIntervalType]===============================================
// Desc    : Use this function to access standard time interval types
// Syntax  : var <ctObject> = new PEMR_TimeIntervalType();
//==============================================================================
function PEMR_TimeIntervalType() {
	//=====[Properties]=====
	this.Daily = 'D';
	this.Weekly = 'W';
	this.Monthly = 'M';
	this.Yearly = 'Y';
	this.DefaultValue = this.Daily;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toUpperCase();
			if (pValue == this.Daily || pValue == this.Weekly || pValue == this.Monthly
				|| pValue == this.Yearly) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'Daily';
		switch (pValue) {
			case this.Daily: retValue = 'Daily'; break;
			case this.Weekly: retValue = 'Weekly'; break;
			case this.Monthly: retValue = 'Monthly'; break;
			case this.Yearly: retValue = 'Yearly'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="D">Daily</option>'
			+ '<option value="W">Weekly</option>'
			+ '<option value="M">Monthly</option>'
			+ '<option value="Y">Yearly</option>';
	}
}
var PTimeIntervalType = new PEMR_TimeIntervalType();


//========[PEMR_AppointmentStatusType]==========================================
// Desc    : Use this function to access standard patient appointment status
// Syntax  : var <ctObject> = new PEMR_AppointmentStatusType();
//==============================================================================
function PEMR_AppointmentStatusType() {
	//=====[Properties]=====
	this.Scheduled = 'Scheduled';
	this.Rescheduled = 'Rescheduled';
	this.NoShow = 'No-Show';
	this.Confirmed = 'Confirmed';
	this.CheckOut = 'Check-out';
	this.CheckIn = 'Check-in';
	this.Cancelled = 'Cancelled';
	this.None = '';
	this.DefaultValue = this.None;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue);
			if (pValue == this.Scheduled || pValue == this.Rescheduled || pValue == this.NoShow
				|| pValue == this.Confirmed || pValue == this.CheckOut || pValue == this.CheckIn
				|| pValue == this.Cancelled || pValue == this.None) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required as the value itself is title
	this.GetOptionHtml = function () {
		return '<option value="">None</option>'
			+ '<option value="Scheduled">Scheduled</option>'
			+ '<option value="Rescheduled">Rescheduled</option>'
			+ '<option value="No-Show">No-Show</option>'
			+ '<option value="Confirmed">Confirmed</option>'
			+ '<option value="Check-out">Check-out</option>'
			+ '<option value="Check-in">Check-in</option>'
			+ '<option value="Cancelled">Cancelled</option>';
	}
}
var PAppointmentStatusType = new PEMR_AppointmentStatusType();


//========[PEMR_PatientStateType]===============================================
// Desc    : Use this function to access patient state type used in PDG
// Syntax  : var <pstObject> = new PEMR_PatientStateType();
//==============================================================================
function PEMR_PatientStateType() {
	//=====[Properties]=====
	this.Enrolled = 'Enrolled';
	this.Discharged = 'Discharged';
	this.ReferredIn = 'ReferredIn';
	this.ReferredOut = 'ReferredOut';
	this.Deceased = 'Deceased';
	this.Other = 'Other';
	this.All = 'All';
	this.DefaultValue = this.All;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue);
			if (pValue == this.Enrolled || pValue == this.Discharged || pValue == this.ReferredIn
				|| pValue == this.ReferredOut || pValue == this.Deceased || pValue == this.Other
				|| pValue == this.All) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required as the value itself is title
	this.GetOptionHtml = function () {
		return '<option value="All">All</option>'
			+ '<option value="Enrolled">Enrolled</option>'
			+ '<option value="Discharged">Discharged</option>'
			+ '<option value="ReferredIn">ReferredIn</option>'
			+ '<option value="ReferredOut">ReferredOut</option>'
			+ '<option value="Deceased">Deceased</option>'
			+ '<option value="Other">Other</option>';
	}

}
var PPatientStateType = new PEMR_PatientStateType();


//========[PEMR_RaceType]=======================================================
// Desc    : Use this function to access race type
// Syntax  : var <rtObject> = new PEMR_RaceType();
//==============================================================================
function PEMR_RaceType() {
	//=====[Properties]=====
	this.All = 0;
	this.Declined = -1;
	this.Caucasian = 1003;
	this.BlackOrAfricanAmerican = 1004;
	this.AmericanIndian = 1005;
	this.AlaskaNative = 1006;
	this.AsianIndian = 1007;
	this.Chinese = 1008;
	this.Filipino = 1009;
	this.Japanese = 1010;
	this.Korean = 1011;
	this.Vietnamese = 1012;
	this.NativeHawaiian = 1013;
	this.GaumanianOrChamorro = 1014;
	this.Samoans = 1015;
	this.OtherPacificIslander = 1016;
	this.BiRacial = 1017;
	this.MultiRacial = 1018;
	this.OtherRace = 1019;
	this.Asian = 1164;
	this.White = 1175;
	this.AmericanIndianOrAlaskaNative = 1180;
	this.NativeHawaiianOrOtherPacificIslander = 1181;
	this.DefaultValue = this.All;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		//First convert the given value into integer
		var valueType = typeof (pValue);
		var parsedValue = this.DefaultValue;
		if (valueType == 'string' || valueType == 'number') {
			pValue = $.trim(' ' + pValue);
			if (pValue != '' && !isNaN(pValue)) {
				parsedValue = parseInt(pValue, 10);
			}
		}

		//Validate the value provided
		if (parsedValue == this.All || parsedValue == this.Declined || parsedValue == this.Caucasian || parsedValue == this.BlackOrAfricanAmerican
			|| parsedValue == this.AmericanIndian || parsedValue == this.AlaskaNative || parsedValue == this.AsianIndian
			|| parsedValue == this.Chinese || parsedValue == this.Filipino || parsedValue == this.Japanese
			|| parsedValue == this.Korean || parsedValue == this.Vietnamese || parsedValue == this.NativeHawaiian
			|| parsedValue == this.GaumanianOrChamorro || parsedValue == this.Samoans || parsedValue == this.OtherPacificIslander
			|| parsedValue == this.BiRacial || parsedValue == this.MultiRacial || parsedValue == this.OtherRace
			|| parsedValue == this.Asian || parsedValue == this.White || this.AmericanIndianOrAlaskaNative || this.NativeHawaiianOrOtherPacificIslander) {
			return parsedValue;
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'All';
		switch (pValue) {
			case this.All: retValue = 'All'; break;
			case this.Declined: retValue = 'Declined'; break;
			case this.Caucasian: retValue = 'Caucasian'; break;
			case this.BlackOrAfricanAmerican: retValue = 'Black or African American'; break;
			case this.AmericanIndian: retValue = 'American Indian'; break;
			case this.AlaskaNative: retValue = 'Alaska Native'; break;
			case this.AsianIndian: retValue = 'Asian Indian'; break;
			case this.Chinese: retValue = 'Chinese'; break;
			case this.Filipino: retValue = 'Filipino'; break;
			case this.Japanese: retValue = 'Japanese'; break;
			case this.Korean: retValue = 'Korean'; break;
			case this.Vietnamese: retValue = 'Vietnamese'; break;
			case this.NativeHawaiian: retValue = 'Native Hawaiian'; break;
			case this.GaumanianOrChamorro: retValue = 'Gaumanian or Chamorro'; break;
			case this.Samoans: retValue = 'Samoans'; break;
			case this.OtherPacificIslander: retValue = 'Other Pacific Islander'; break;
			case this.BiRacial: retValue = 'Bi-racial'; break;
			case this.MultiRacial: retValue = 'Multi-racial'; break;
			case this.OtherRace: retValue = 'Other Race'; break;
			case this.Asian: retValue = 'Asian'; break;
			case this.White: retValue = 'White'; break;
			case this.AmericanIndianOrAlaskaNative: retValue = 'American Indian or Alaska Native'; break;
			case this.NativeHawaiianOrOtherPacificIslander: retValue = 'Native Hawaiian or Other Pacific Islander'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		//return '<option value="0">All</option>'
		//	+ '<option value="-1">Declined</option>'
		//	+ '<option value="1180">American Indian or Alaska Native</option>'
		//	+ '<option value="1164">Asian</option>'
		//	+ '<option value="1004">Black or African American</option>'
		//	+ '<option value="1181">Native Hawaiian or Other Pacific Islander</option>'
		//	+ '<option value="1175">White</option>'
		//	+ '<option value="1019">Other Race</option>';
		return '<option value="0">All</option>'
			+ '<option value="-1">Declined</option>'
			+ '<option value="1003">Caucasian</option>'
			+ '<option value="1004">Black or African American</option>'
			+ '<option value="1005">American Indian</option>'
			+ '<option value="1006">Alaska Native</option>'
			+ '<option value="1007">Asian Indian</option>'
			+ '<option value="1008">Chinese</option>'
			+ '<option value="1009">Filipino</option>'
			+ '<option value="1010">Japanese</option>'
			+ '<option value="1011">Korean</option>'
			+ '<option value="1012">Vietnamese</option>'
			+ '<option value="1013">Native Hawaiian</option>'
			+ '<option value="1014">Gaumanian or Chamorro</option>'
			+ '<option value="1015">Samoans</option>'
			+ '<option value="1016">Other Pacific Islander</option>'
			//+ '<option value="1017">Bi-racial</option>'
			//+ '<option value="1018">Multi-racial</option>'
			//+ '<option value="1019">Other Race</option>'
			+ '<option value="1164">Asian</option>'
			+ '<option value="1175">White</option>'
			+ '<option value="1180">American Indian or Alaska Native</option>'
			+ '<option value="1181">Native Hawaiian or Other Pacific Islander</option>';
	}
}
var PRaceType = new PEMR_RaceType();


//========[PEMR_EthnicityType]==================================================
// Desc    : Use this function to access ethnicity type
// Syntax  : var <etObject> = new PEMR_EthnicityType();
//==============================================================================
function PEMR_EthnicityType() {
	//=====[Properties]=====
	this.Hispanic_Latino = 1139;
	this.NotHispanic_Latino = 1140;
	this.Declined = -1;
	this.All = 0;
	this.DefaultValue = this.All;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		//First convert the given value into integer
		var valueType = typeof (pValue);
		var parsedValue = this.DefaultValue;
		if (valueType == 'string' || valueType == 'number') {
			pValue = $.trim(' ' + pValue);
			if (pValue != '' && !isNaN(pValue)) {
				parsedValue = parseInt(pValue, 10);
			}
		}

		//Validate the value provided
		if (parsedValue == this.Hispanic_Latino || parsedValue == this.NotHispanic_Latino || parsedValue == this.Declined || this.All) {
			return parsedValue;
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'All';
		switch (pValue) {
			case this.All: retValue = 'All'; break;
			case this.Declined: retValue = 'Declined'; break;
			case this.NotHispanic_Latino: retValue = 'Not Hispanic/Latino'; break;
			case this.Hispanic_Latino: retValue = 'Hispanic/Latino'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="0">All</option>'
			+ '<option value="-1">Declined</option>'
			+ '<option value="1139">Hispanic/Latino</option>'
			+ '<option value="1140">Not Hispanic/Latino</option>';
	}
}
var PEthnicityType = new PEMR_EthnicityType();

//========[PEMR_PreferredLanguageType]=======================================================
// Desc    : Use this function to access Preferred Language type
// Syntax  : var <rtObject> = new PEMR_PreferredLanguageType();
//==============================================================================
// Global Array to hold Preferred Languages
var Global_PreferredLanguages = [];
//Get Preferred Language options from service and assign to select control
function PEMR_PreferredLanguageType() {
	//=====[Properties]=====
	this.All = 0;
	this.Declined = -1;
	this.DefaultValue = this.All;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		var retValue = [];
		//First convert the given value into integer
		var valueType = typeof (pValue);
		var parsedValue = this.DefaultValue;
		if (valueType == 'string' || valueType == 'number') {
			pValue = $.trim(' ' + pValue);
			if (pValue != '' && !isNaN(pValue)) {
				parsedValue = parseInt(pValue, 10);
			}
		}

		//Validate the value provided
		retValue = $.grep(Global_PreferredLanguages, function (value, index) {
			return (parseInt(value.LookupCode) == parsedValue);
		});

		if (retValue != undefined && retValue.length > 0) {
			console.log('retValue length= ' + retValue.length + ' Value= ' + parseInt(retValue[0].LookupCode) + ' parsedValue= ' + parsedValue);
			return parsedValue;
		}
		//In all other cases return default value
		return this.DefaultValue;
	}

	this.GetPropertyName = function (pValue) {
		var retValue = 'All';
		var checkValue = [];

		checkValue = $.grep(Global_PreferredLanguages, function (value, index) {
			return (pValue == value.LookupCode);
		});
		if (checkValue != undefined && checkValue.length > 0) {
			console.log('checkValue length= ' + checkValue.length + ' Value= ' + parseInt(checkValue[0].LookupCode) + ' Desc= ' + checkValue[0].LookupDesc);
			return checkValue[0].LookupDesc;
		}
		return retValue;
	}

	// BindLanguageOptionHtml function makes async service call to get Language Options from Database and binds the Language options to the control
	// if selectedLanguageCode is not undefined then selects the the corresponding laguage in the control.
	this.BindLanguageOptionHtml = function (control, selectedLanguageCode) {
		if (Global_PreferredLanguages.length < 1) {
			$.ajax({
				url: window.location.protocol + '//' + window.location.host + '/Services/Lookupservice.svc/GetLanguageOptionList',
				success: function (response) {
					Global_PreferredLanguages = response ? response : [];
					setLanguageOptionHtml(control, selectedLanguageCode);
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					PEMR_LogInFBC_WCFError('PEMR_PreferredLanguageType GetOptionHtml', XMLHttpRequest, textStatus, errorThrown);
				}
			});
		}
		else {
			setLanguageOptionHtml(control, selectedLanguageCode);
		}
	}

	// Binds the Language Option Html to the Control, if selectedLanguageCode is passed then
	// selects the Language option in the Control.
	function setLanguageOptionHtml($control, selectedLanguageCode) {
		if (selectedLanguageCode == undefined) {
			$control.html(getlanguageOptionHtmlString);
		}
		else {
			var $languageSelected = $control.find('option[value="' + selectedLanguageCode + '"]');
			if ($languageSelected.length == 0) {
				$control.html(getlanguageOptionHtmlString);
			}
			$languageSelected.prop('selected', true);
		}
	}

	// Generates & returns Language Option html string from the Global_PreferredLanguages array
	function getlanguageOptionHtmlString() {
		var languageOptionHtmlString = '<option lookupkey="" lookupcode="0" lookupdesc="All" mcode="" shortname="" value="0">All</option>'
			   + '<option lookupkey="" lookupcode="-1" lookupdesc="Declined" mcode="" shortname="" value="-1">Declined</option>';
		for (var count = 0; count < Global_PreferredLanguages.length; count++) {
			languageOptionHtmlString += '<option lookupkey="' + Global_PreferredLanguages[count].LookupKey + '" lookupcode="' + Global_PreferredLanguages[count].LookupCode
				+ '" lookupdesc="' + Global_PreferredLanguages[count].LookupDesc + '" mcode="' + Global_PreferredLanguages[count].MCode
				+ '" shortname="' + Global_PreferredLanguages[count].ShortName + '" value="' + Global_PreferredLanguages[count].LookupCode + '">'
				+ Global_PreferredLanguages[count].LookupDesc + '</option>';
		}
		return languageOptionHtmlString;
	}
}
var PPreferredLanguageType = new PEMR_PreferredLanguageType();
//========[PEMR_StatusType]=====================================================
// Desc    : Use this function to access status type
// Syntax  : var <stObject> = new PEMR_StatusType();
//==============================================================================
function PEMR_StatusType() {
	//=====[Properties]=====
	this.Active = 1;
	this.Inactive = 0;
	this.All = 2;
	this.DefaultValue = this.All;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		//First convert the given value into integer
		var valueType = typeof (pValue);
		var parsedValue = parseInt('0', 10);
		if (valueType == 'string' || valueType == 'number') {
			pValue = $.trim(' ' + pValue);
			if (pValue != '' && !isNaN(pValue)) {
				parsedValue = parseInt(pValue, 10);
			}
		}

		//Validate the value provided
		if (parsedValue == this.Active || parsedValue == this.Inactive || parsedValue == this.All) {
			return parsedValue;
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'All';
		switch (pValue) {
			case this.All: retValue = 'All'; break;
			case this.Inactive: retValue = 'Inactive'; break;
			case this.Active: retValue = 'Active'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="2">All</option>'
			+ '<option value="0">Inactive</option>'
			+ '<option value="1">Active</option>';
	}

}
var PStatusType = new PEMR_StatusType();


//========[PEMR_AuthorizationStatusType]========================================
// Desc    : Use this function to access status type
// Syntax  : var <astObject> = new PEMR_AuthorizationStatusType();
//==============================================================================
function PEMR_AuthorizationStatusType() {
	//=====[Properties]=====
	this.RequestSubmitted = 'Request Submitted';
	this.Approved = 'Approved';
	this.ApprovedWithChanges = 'Approved With Changes';
	this.Denied = 'Denied';
	this.Inactive = 'Inactive';
	this.DefaultValue = this.RequestSubmitted;
	this.Archive = 'Archive';

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue);
			if (pValue == this.RequestSubmitted || pValue == this.Approved || pValue == this.ApprovedWithChanges
				|| pValue == this.Denied || pValue == this.Inactive || pValue == this.Archive) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'Request Submitted';
		switch (pValue) {
			case this.RequestSubmitted: retValue = 'Request Submitted'; break;
			case this.Approved: retValue = 'Approved'; break;
			case this.ApprovedWithChanges: retValue = 'Approved With Changes'; break;
			case this.Denied: retValue = 'Denied'; break;
			case this.Inactive: retValue = 'Inactive'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="Request Submitted">Request Submitted</option>'
			+ '<option value="Approved">Approved</option>'
			+ '<option value="Approved With Changes">Approved With Changes</option>'
			+ '<option value="Denied">Denied</option>'
			+ '<option value="Inactive">Inactive</option>';
	}
}
var PAuthorizationStatusType = new PEMR_AuthorizationStatusType();


//========[PEMR_PracticeType]===================================================
// Desc    : Use this function to access practice type
// Syntax  : var <ptObject> = new PEMR_PracticeType();
//==============================================================================
function PEMR_PracticeType() {
	//=====[Properties]=====
	this.FamilyPractice = 'Family Practice';
	this.MentalHealth = 'Mental Health';
	this.NCPublicHealth = 'NCPublicHealth';
	this.MDPublicMentalHealth = 'MDPublicMentalHealth';
	this.ILPublicHealth = 'ILPublicHealth';
	this.PublicMentalHealth = 'PublicMentalHealth';
	this.COPublicMentalHealth = "COPublicMentalHealth";

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue);
			if (pValue == this.FamilyPractice || pValue == this.MentalHealth
				|| pValue == this.NCPublicHealth || pValue == this.MDPublicMentalHealth || pValue == this.ILPublicHealth
				|| pValue == this.PublicMentalHealth || pValue == this.COPublicMentalHealth) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.FamilyPractice;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'Family Practice';
		switch (pValue) {
			case this.FamilyPractice: retValue = 'Family Practice'; break;
			case this.MentalHealth: retValue = 'Mental Health'; break;
			case this.NCPublicHealth: retValue = 'NCPublicHealth'; break;
			case this.MDPublicMentalHealth: retValue = 'MDPublicMentalHealth'; break;
			case this.ILPublicHealth: retValue = 'ILPublicHealth'; break;
			case this.PublicMentalHealth: retValue = 'PublicMentalHealth'; break;
			case this.COPublicMentalHealth: retValue = 'COPublicMentalHealth'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="Family Practice">Family Practice</option>'
			+ '<option value="Mental Health">Mental Health</option>'
			+ '<option value="NCPublicHealth">NCPublicHealth</option>'
			+ '<option value="MDPublicMentalHealth">MDPublicMentalHealth</option>'
			+ '<option value="ILPublicHealth">ILPublicHealth</option>'
			+ '<option value="PublicMentalHealth">Public Mental Health</option>'
			+ '<option value="COPublicMentalHealth">COPublicMentalHealth</option>';
	}

	//Before calling below "Is??" functions it is recommended to call the Convert() function
	this.IsPracticeFamilyHealth = function (pValue) {
		if (typeof (pValue) == 'string') {
			if (pValue == this.FamilyPractice) {
				return true;
			}
		}
		return false;
	}
	this.IsPracticeMentalHealth = function (pValue) {
		if (typeof (pValue) == 'string') {
			if (pValue == this.MentalHealth) {
				return true;
			}
		}
		return false;
	}
	this.IsPracticeNCPublicHealth = function (pValue) {
		if (typeof (pValue) == 'string') {
			if (pValue == this.NCPublicHealth || pValue == this.PublicMentalHealth) {
				return true;
			}
		}
		return false;
	}
	this.IsPracticeMDPublicMentalHealth = function (pValue) {
		if (typeof (pValue) == 'string') {
			if (pValue == this.MDPublicMentalHealth) {
				return true;
			}
		}
		return false;
	}
	this.IsPracticeILPublicHealth = function (pValue) {
		if (typeof (pValue) == 'string') {
			if (pValue == this.ILPublicHealth) {
				return true;
			}
		}
		return false;
	}
	this.IsPracticePublicMentalHealth = function (pValue) {
		if (typeof (pValue) == 'string') {
			if (pValue == this.PublicMentalHealth) {
				return true;
			}
		}
		return false;
	}
	this.IsPracticeCOPublicMentalHealth = function (pValue) {
		if (typeof (pValue) == 'string') {
			if (pValue == this.COPublicMentalHealth) {
				return true;
			}
		}
		return false;
	}
}
var PPracticeType = new PEMR_PracticeType();


//========[PEMR_GoalProgressType]===============================================
// Desc    : Use this function to access goal progress type
// Syntax  : var <pgptObject> = new PEMR_GoalProgressType();
//==============================================================================
function PEMR_GoalProgressType() {
	//=====[Properties]=====
	this.NotSet = '';
	this.RegressedNoProgress = 'Regressed/No Progress';
	this.NoProgress = 'No Progress';
	this.MinorProgress = 'Minor Progress';
	this.ModerateProgress = 'Moderate Progress';
	this.SignificantProgress = 'Significant Progress';
	this.Achieved = 'Achieved';
	this.Revised = 'Revised';
	this.Ongoing = 'Ongoing';
	this.Discontinued = 'Discontinued';
	this.DefaultValue = this.NoProgress;


	//=====[Methods]=====
	this.GetGoalIndexByName = function (goalProgressTypeValue) {
		var code = 0;
		switch (goalProgressTypeValue) {
			case this.NotSet: code = 1; break;
			case this.RegressedNoProgress: code = 2; break;
			case this.NoProgress: code = 3; break;
			case this.MinorProgress: code = 4; break;
			case this.ModerateProgress: code = 5; break;
			case this.SignificantProgress: code = 6; break;
			case this.Achieved: code = 7; break;
			case this.Revised: code = 8; break;
			case this.Ongoing: code = 9; break;
			case this.Discontinued: code = 10; break;
			default: code = 0; break;
		}
		return code;
	}
	this.GetOptionHtml = function () {
		return ''
			+ '<option value="' + this.NotSet + '">--Select--</option>'
			+ '<option value="' + this.RegressedNoProgress + '">' + this.RegressedNoProgress + '</option>'
			+ '<option value="' + this.NoProgress + '">' + this.NoProgress + '</option>'
			+ '<option value="' + this.MinorProgress + '">' + this.MinorProgress + '</option>'
			+ '<option value="' + this.ModerateProgress + '">' + this.ModerateProgress + '</option>'
			+ '<option value="' + this.SignificantProgress + '">' + this.SignificantProgress + '</option>'
			+ '<option value="' + this.Achieved + '">' + this.Achieved + '</option>'
			+ '<option value="' + this.Revised + '">' + this.Revised + '</option>'
			+ '<option value="' + this.Ongoing + '">' + this.Ongoing + '</option>'
			+ '<option value="' + this.Discontinued + '">' + this.Discontinued + '</option>'
			+ '';
	}
	this.GetPaddedName = function (goalProgressTypeValue) {
		var returnString = '';
		switch (goalProgressTypeValue) {
			case PGoalProgressType.NotSet:
				returnString = 'NOT SET&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
			case PGoalProgressType.RegressedNoProgress:
				returnString = 'Regressed/No Progress';
				break;
			case PGoalProgressType.NoProgress:
				returnString = 'No Progress&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
			case PGoalProgressType.MinorProgress:
				returnString = 'Minor Progress&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
			case PGoalProgressType.ModerateProgress:
				returnString = 'Moderate Progress&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
			case PGoalProgressType.SignificantProgress:
				returnString = 'Significant Progress&nbsp;';
				break;
			case PGoalProgressType.Achieved:
				returnString = 'Achieved&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
			case PGoalProgressType.Revised:
				returnString = 'Revised&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
			case PGoalProgressType.Ongoing:
				returnString = 'Ongoing&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
			case PGoalProgressType.Discontinued:
				returnString = 'Discontinued&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
				break;
		}
		return returnString;
	}
	this.GetGoalColor = function (goalProgressTypeValue) {
		var returnString = '';
		switch (goalProgressTypeValue) {
			case PGoalProgressType.NotSet:
				returnString = PColorType.Black;
				break;
			case PGoalProgressType.RegressedNoProgress:
				returnString = PColorType.CCRed;
				break;
			case PGoalProgressType.NoProgress:
				returnString = PColorType.Black;
				break;
			case PGoalProgressType.MinorProgress:
				returnString = PColorType.Black;
				break;
			case PGoalProgressType.ModerateProgress:
				returnString = PColorType.Black;
				break;
			case PGoalProgressType.SignificantProgress:
				returnString = PColorType.Black;
				break;
			case PGoalProgressType.Achieved:
				returnString = PColorType.CCGreen;
				break;
			case PGoalProgressType.Revised:
				returnString = PColorType.Black;
				break;
			case PGoalProgressType.Ongoing:
				returnString = PColorType.Black;
				break;
			case PGoalProgressType.Discontinued:
				returnString = PColorType.Black;
				break;
		}
		return returnString;
	}
	this.GetValuesStringArray = function () {
		var retArray = [];
		retArray.push(PGoalProgressType.NotSet);
		retArray.push(PGoalProgressType.RegressedNoProgress);
		retArray.push(PGoalProgressType.NoProgress);
		retArray.push(PGoalProgressType.MinorProgress);
		retArray.push(PGoalProgressType.ModerateProgress);
		retArray.push(PGoalProgressType.SignificantProgress);
		retArray.push(PGoalProgressType.Achieved);
		retArray.push(PGoalProgressType.Revised);
		retArray.push(PGoalProgressType.Ongoing);
		retArray.push(PGoalProgressType.Discontinued);
		return retArray;
	}
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue);
			if (pValue == this.NotSet || pValue == this.RegressedNoProgress || pValue == this.NoProgress
				|| pValue == this.MinorProgress || pValue == this.ModerateProgress || pValue == this.SignificantProgress
				|| pValue == this.Achieved || pValue == this.Revised || pValue == this.Ongoing
				|| pValue == this.Discontinued) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
}
var PGoalProgressType = new PEMR_GoalProgressType();


//========[PEMR_ProblemStatusType]==============================================
// Desc    : Use this function to access problem status type
// Syntax  : var <pstObject> = new PEMR_ProblemStatusType();
//==============================================================================
function PEMR_ProblemStatusType() {
	//=====[Properties]=====
	this.All = 'All';
	this.Inactive = 'Inactive';
	this.Current = 'Current';
	this.Resolved = 'Resolved';
	this.DefaultValue = this.Current;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue);
			if (pValue == this.All || pValue == this.Inactive || pValue == this.Current
				|| pValue == this.Resolved) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required as value is equal to name
	this.GetOptionHtml = function () {
		return '<option value="All">All</option>'
			+ '<option value="Inactive">Inactive</option>'
			+ '<option value="Current">Current</option>'
			+ '<option value="Resolved">Resolved</option>';
	}
}
var PProblemStatusType = new PEMR_ProblemStatusType();


//========[PEMR_ServiceCodeType]================================================
// Desc    : Use this function to access service code type
// Syntax  : var <sctObject> = new PEMR_ServiceCodeType();
//==============================================================================
function PEMR_ServiceCodeType() {
	//=====[Properties]=====
	this.ProgressNote = 'PN';
	this.EncounterNote = 'EN';
	this.MaryLand = 'MD';
	this.Colorado = 'CO';
	this.HIV = 'HI';
	this.CSHCS = 'CH';
	this.MIHP = 'MI';
	this.HV = 'HV';
	this.TC = 'TC'; // For Tobacco Cessation Form Service Code Type
	this.DefaultValue = this.EncounterNote;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toUpperCase();
			if (pValue == this.ProgressNote || pValue == this.EncounterNote) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required
	//this.GetOptionHtml = function () { } //Not-required
}
var PServiceCodeType = new PEMR_ServiceCodeType();


//========[PEMR_DurationSelectType]=============================================
// Desc    : Use this function to access possible duration select options
// Syntax  : var <dstObject> = new PEMR_DurationSelectType();
//==============================================================================
function PEMR_DurationSelectType() {
	//=====[Properties]=====
	this.All = 'all';
	this.Range = 'range';
	this.Today = 'today';
	this.Week = 'week';
	this.Month = 'month';
	this.TwoMonths = 'twomonths';
	this.ThreeMonths = 'threemonths';
	this.FourMonths = 'fourmonths';
	this.FiveMonths = 'fivemonths';
	this.SixMonths = 'sixmonths';
	this.SevenMonths = 'sevenmonths';
	this.EightMonths = 'eightmonths';
	this.NineMonths = 'ninemonths';
	this.TenMonths = 'tenmonths';
	this.ElevenMonths = 'elevenmonths';
	this.TwelveMonths = 'twelvemonths';
	this.TwoYears = 'twoyears';
	this.DefaultValue = this.Today;
	this.ComingMonth = 'comingmonth';
	this.ComingWeek = 'comingweek';
	this.AllUpcoming = 'allupcoming';

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toLowerCase();
			if (pValue == this.All || pValue == this.Range || pValue == this.Today
				|| pValue == this.Week || pValue == this.Month || pValue == this.TwoMonths || pValue == this.ThreeMonths || pValue == this.FourMonths || pValue == this.FiveMonths
				|| pValue == this.SixMonths || pValue == this.SevenMonths || pValue == this.EightMonths || pValue == this.NineMonths || pValue == this.TenMonths || pValue == this.ElevenMonths
				|| pValue == this.TwelveMonths || pValue == this.TwoYears
				|| pValue == this.ComingMonth || pValue == this.ComingWeek || pValue == this.AllUpcoming) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	this.GetPropertyName = function (pValue) {
		var retValue = 'All';
		switch (pValue) {
			case this.All: retValue = 'All'; break;
			case this.Range: retValue = 'Range'; break;
			case this.Today: retValue = 'Today'; break;
			case this.Week: retValue = 'Past week'; break;
			case this.Month: retValue = 'Past month'; break;
			case this.TwoMonths: retValue = 'Past 2 months'; break;
			case this.ThreeMonths: retValue = 'Past 3 months'; break;
			case this.FourMonths: retValue = 'Past 4 months'; break;
			case this.FiveMonths: retValue = 'Past 5 months'; break;
			case this.SixMonths: retValue = 'Past 6 months'; break;
			case this.SevenMonths: retValue = 'Past 7 months'; break;
			case this.EightMonths: retValue = 'Past 8 months'; break;
			case this.NineMonths: retValue = 'Past 9 months'; break;
			case this.TenMonths: retValue = 'Past 10 months'; break;
			case this.ElevenMonths: retValue = 'Past 11 months'; break;
			case this.TwelveMonths: retValue = 'Past 12 months'; break;
			case this.TwoYears: retValue = 'Past 2 years'; break;
			case this.ComingMonth: retValue = 'Coming Month'; break;
			case this.ComingWeek: retValue = 'Coming Week'; break;
			case this.AllUpcoming: retValue = 'All Upcoming'; break;
		}
		return retValue;
	}
	this.GetOptionHtml = function () {
		return '<option value="all">All</option>'
			+ '<option value="range">Range</option>'
			+ '<option value="today">Today</option>'
			+ '<option value="week">Past week</option>'
			+ '<option value="month">Past month</option>'
			+ '<option value="threemonths">Past 3 months</option>'
			+ '<option value="twelvemonths">Past 12 months</option>'
			+ '<option value="twoyears">Past 2 years</option>';
	}
}
var PDurationSelectType = new PEMR_DurationSelectType();



//========[PEMR_SortType]=======================================================
// Desc    : Use this function to access sort Type
// Syntax  : var <stObject> = new PEMR_SortType();
//==============================================================================
function PEMR_SortType() {
	//=====[Properties]=====
	this.Asc = 'asc';
	this.Desc = 'desc';
	this.DefaultValue = this.Asc;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toLowerCase();
			if (pValue == this.Asc || pValue == this.Desc) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required
	//this.GetOptionHtml = function () { } //Not-required
}
var PSortType = new PEMR_SortType();



//========[PEMR_SignStatusType]=================================================
// Desc    : Use this function to access Sign Status Type
// Syntax  : var <sstObject> = new PEMR_SignStatusType();
//==============================================================================
function PEMR_SignStatusType() {
	//=====[Properties]=====
	this.Signed = 'Signed';
	this.Open = 'Open';
	this.DefaultValue = this.Open;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue);
			if (pValue == this.Signed || pValue == this.Open) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required
	this.GetOptionHtml = function () {
		var optHtml = '' +
			'<option value="' + this.Open + '">' + this.Open + '</option>' +
			'<option value="' + this.Signed + '">' + this.Signed + '</option>';
		return optHtml;
	}
}
var PSignStatusType = new PEMR_SignStatusType();


//========[PEMR_DataType]=======================================================
// Desc    : Use this function to access data Type
// Syntax  : var <dtObject> = new PEMR_DataType();
//==============================================================================
function PEMR_DataType() {
	//=====[Properties]=====
	this.Integer = 'integer';
	this.Decimal = 'decimal';
	this.Date = 'date';
	this.String = 'string';
	this.EmptyString = 'emptystring';
	this.NullableString = 'nullstring';
	this.Guid = 'guid';
	this.DefaultValue = this.NullableString;

	//=====[Methods]=====
	this.Convert = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(' ' + pValue).toLowerCase();
			if (pValue == this.Integer || pValue == this.Decimal || pValue == this.Date
				|| pValue == this.String || pValue == this.EmptyString || pValue == this.NullableString
				|| pValue == this.Guid) {
				return pValue;
			}
		}

		//In all other cases return default value
		return this.DefaultValue;
	}
	//this.GetPropertyName = function (pValue) { } //Not-required
	//this.GetOptionHtml = function () { } //Not-required
}
var PDataType = new PEMR_DataType();



//===[ PEMR_JSONOperations ]====================================================
// Desc    : Contains Datatype conversion functions useful while operating
//           on DTO objects
// Syntax  : var <pageLevelVar1> = new PEMR_JSONOperations();
//==============================================================================
function PEMR_JSONOperations() {
	//============================================================
	//Default values returned in case of conversion errors
	//------------------------------------------------------------
	//Syntax: this.Default<TypeName> = <value>;
	//============================================================
	this.DefaultArray = [];
	this.DefaultArrayList = [];
	this.DefaultBool01 = 0;
	this.DefaultBooltruefalse = false;
	this.DefaultBooltruefalseString = 'false';
	this.DefaultBoolyesnoString = 'no';
	this.DefaultDate = null;
	this.DefaultDateTime = null;
	this.DefaultDecimal = parseFloat('0.00');
	this.DefaultGuid = '00000000-0000-0000-0000-000000000000';
	this.NullGuid = null;
	this.DefaultInteger = parseInt('0', 10);
	this.DefaultString = null;

	this.EmptyString = '';
	this.NullString = null;


	//============================================================
	//Data Object level - function notations
	//------------------------------------------------------------
	//Object Creation:
	//  ModuleCode_Object_DTOName(){}
	//
	//Reset Values:
	//  ModuleCode_Object_DTOName_ResetValues(){}
	//
	//Formating Values:
	//  ModuleCode_Object_DTOName_FormatValues(){}
	//============================================================

	//============================================================
	//Data Object Collection level - function notations
	//------------------------------------------------------------
	//Objects Dummy Data:
	//  ModuleCode_Object_DTONameList_DummyJSON(){}
	//
	//Objects Sorting By FieldName:
	//  ModuleCode_Object_DTONameList_sortAsc_FieldName
	//  ModuleCode_Object_DTONameList_sortDesc_FieldName
	//
	//Objects Formatting:
	//  ModuleCode_Object_DTONameList_FormatValues(){}
	//============================================================


	//============================================================
	//Verification Functions: Returns true/false
	//------------------------------------------------------------
	//Syntax: this.Is<DataTypeName> = function(pValue){}
	//------------------------------------------------------------
	//These functions operates based on the following
	//01) typeof([]) = 'object'
	//02) [].length = '0'
	//03) typeof(null) = 'object'
	//04) typeof({}) = 'object'
	//05) {}.length = 'undefined'
	//06) typeof('') = 'string'
	//07) typeof(1) = 'number'
	//08) typeof(-1) = 'number'
	//09) typeof(1.1) = 'number'
	//10) typeof(-1.1) = 'number'
	//============================================================
	//Moved these functions to top so, that we can use them in the type conversion functions
	this.IsArrayList = function (pValue) {
		if (typeof (pValue) == 'object' && pValue != null
			&& typeof (pValue.length) != 'undefined' && pValue.length >= 0) {
			return true;
		}
		return false;
	}
	this.IsEmptyArrayList = function (pValue) {
		if (typeof (pValue) == 'object' && pValue != null
			&& typeof (pValue.length) != 'undefined' && pValue.length == 0) {
			return true;
		}
		return false;
	}
	this.IsString = function (pValue) {
		if (typeof (pValue) == 'string') { return true; }
		return false;
	}
	this.IsEmptyString = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(pValue + ' ');
			if (pValue.length == 0) { return true; }
		}
		return false;
	}
	this.IsNullOrEmptyString = function (pValue) {
		if (typeof (pValue) == 'object') { if (pValue == null) { return true; } }
		if (typeof (pValue) == 'string') {
			pValue = $.trim(pValue + ' ');
			if (pValue.length == 0) { return true; }
		}
		return false;
	}
	this.IsNullOrEmptyOrUndefinedString = function (pValue) {
		if (typeof (pValue) == 'undefined') { return true; }
		if (typeof (pValue) == 'object') { if (pValue == null) { return true; } }
		if (typeof (pValue) == 'string') {
			pValue = $.trim(pValue + ' ');
			if (pValue.length == 0) { return true; }
		}
		return false;
	}
	this.IsEmptyGuid = function (pValue) {
		if (typeof (pValue) == 'undefined') { return true; }
		if (typeof (pValue) == 'object') { if (pValue == null) { return true; } }
		if (typeof (pValue) == 'string') {
			pValue = $.trim(pValue + ' ');
			if (pValue.length == 0) { return true; }
			if (pValue == this.DefaultGuid) { return true; }
		}
		return false;
	}
	this.IsDecimal = function (pValue) {
		var valueType = typeof (pValue);
		if (valueType == 'string' || valueType == 'number') {
			pValue = $.trim(pValue + ' ');
			if (pValue != '' && !isNaN(pValue)) {
				return true;
			}
		}
		return false;
	}

	//============================================================
	//Conversion functions
	//------------------------------------------------------------
	//Syntax: this.C<DataTypeName> = function(pValue){}
	//============================================================
	//TODO: All instances of the below function should be changed to CArray when worked on
	this.CArrayList = function (pValue) {
		if (typeof (pValue) == 'object' && pValue != null
			&& typeof (pValue.length) != 'undefined' && pValue.length >= 0) {
			//do nothing
		}
		pValue = this.DefaultArrayList;
	};

	this.CDefaultArray = function (pValue) {
		var retObj = this.DefaultArrayList;
		if (typeof (pValue) == 'object' && pValue != null
			&& typeof (pValue.length) == 'number' && pValue.length >= 0) {
			retObj = pValue;
		}
		return retObj;
	};


	this.CBool01 = function (pValue) {
		if (pValue == 1 || pValue == '1') {
			return 1;
		}
		else {
			return this.DefaultBool01;
		}
	};

	this.CBooltruefalse = function (pValue) {
		pValue = $.trim(pValue + ' ').toLowerCase();
		if (pValue == 'true' || pValue == 't'
			|| pValue == 'yes' || pValue == 'y'
			|| pValue == '1') {
			return true;
		}
		else {
			return this.DefaultBooltruefalse;
		}
	};

	this.CBooltruefalseString = function (pValue) {
		pValue = $.trim(pValue + ' ').toLowerCase();
		if (pValue == 'true' || pValue == 't'
			|| pValue == 'yes' || pValue == 'y'
			|| pValue == '1') {
			return 'true';
		}
		else {
			return this.DefaultBooltruefalseString;
		}
	};

	this.CBoolyesnoString = function (pValue) {
		pValue = $.trim(pValue + ' ').toLowerCase();
		if (pValue == 'true' || pValue == 't'
				|| pValue == 'yes' || pValue == 'y'
				|| pValue == '1') {
			return 'yes';
		}
		else {
			return this.DefaultBoolyesnoString;
		}
	};

	this.CDate = function (pValue) {
		//Accepted format by C# & JS :: m/d/yyyy
		if (pValue == undefined || pValue == '' || pValue == null) {
			return this.DefaultDate;
		}
		pValue = Date.parse(pValue);
		if (isNaN(pValue)) {
			return this.DefaultDate;
		}
		pValue = new Date(pValue);
		pValue = (pValue.getMonth() + 1) + '/' + pValue.getDate() + '/' + pValue.getFullYear();
		return pValue;
	};

	this.CDateTime = function (pValue) {
		//Accepted format by C# & JS :: m/d/yyyy HH:MM:SS
		if (pValue == undefined || pValue == '' || pValue == null) {
			return this.DefaultDateTime;
		}
		pValue = Date.parse(pValue);
		if (isNaN(pValue)) {
			return this.DefaultDateTime;
		}
		pValue = new Date(pValue);
		pValue = pValue.getMonth() + '/' + pValue.getDate() + '/' + pValue.getFullYear()
			+ ' ' + pValue.getHours() + ':' + pValue.getMinutes() + ':' + pValue.getSeconds();
		return pValue;
	};

	this.CDateObj = function (pValue) {
		//Accepted format by C# & JS :: m/d/yyyy
		if (pValue == undefined || pValue == '' || pValue == null) {
			return this.DefaultDate;
		}
		pValue = Date.parse(pValue);
		if (isNaN(pValue)) {
			return this.DefaultDate;
		}
		return new Date(pValue);
	};

	this.CDateTimeObj = function (pValue) {
		//Accepted format by C# & JS :: m/d/yyyy HH:MM:SS
		if (pValue == undefined || pValue == '' || pValue == null) {
			return this.DefaultDateTime;
		}
		pValue = Date.parse(pValue);
		if (isNaN(pValue)) {
			return this.DefaultDateTime;
		}
		return new Date(pValue);
	};

	this.CDecimal = function (pValue) {
		var valueType = typeof (pValue);
		if (valueType == 'string' || valueType == 'number') {
			pValue = $.trim(pValue + ' ');
			if (pValue != '' && !isNaN(pValue)) {
				return parseFloat(pValue);
			}
		}
		return parseFloat('0.00');
	};

	this.CDefaultGuid = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(pValue + ' ');
			if (pValue == '') {
				return '00000000-0000-0000-0000-000000000000';
			}
			else {
				var guidRE = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/;
				if (guidRE.test(pValue)) {
					return pValue;
				}
			}
		}
		return '00000000-0000-0000-0000-000000000000';
	};

	this.CNullGuid = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(pValue + ' ');
			if (pValue == '' || pValue == '00000000-0000-0000-0000-000000000000') {
				return null;
			}
			else {
				var guidRE = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/;
				if (guidRE.test(pValue)) {
					return pValue;
				}
			}
		}
		return null;
	}

	this.CEmptyGuid = function (pValue) {
		if (typeof (pValue) == 'string') {
			pValue = $.trim(pValue + ' ');
			if (pValue == '' || pValue == '00000000-0000-0000-0000-000000000000') {
				return '';
			}
			else {
				var guidRE = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/;
				if (guidRE.test(pValue)) {
					return pValue;
				}
			}
		}
		return '';
	}


	this.CInteger = function (pValue) {
		var valueType = typeof (pValue);
		if (valueType == 'string' || valueType == 'number') {
			pValue = $.trim(pValue + ' ');
			if (pValue != '' && !isNaN(pValue)) {
				return parseInt(pValue, 10);
			}
		}
		return parseInt('0', 10);
	};

	this.ConvertToString = function (pValue, pVoidValue) {
		var vReturnVal = pVoidValue;
		switch (typeof (pValue)) {
			case 'boolean':
				vReturnVal = pValue.toString();
				break;
			case 'number':
				vReturnVal = pValue.toString();
				break;
			case 'string':
				vReturnVal = $.trim(pValue + ' ');
				if (vReturnVal == '') { vReturnVal = pVoidValue; }
				break;
			default: //Incase of [undefined, function]
				vReturnVal = pVoidValue;
				break;
		}
		return vReturnVal;
	}

	this.CNullString = function (pValue) {
		var valueType = typeof (pValue);
		if (valueType == 'string' || valueType == 'number' || valueType == 'boolean') {
			pValue = $.trim(pValue + ' ');
			if (pValue != '') { return pValue; }
		}
		return null;
	}

	this.CEmptyString = function (pValue) {
		var valueType = typeof (pValue);
		if (valueType == 'string' || valueType == 'number' || valueType == 'boolean') {
			pValue = $.trim(pValue + ' ');
			if (pValue != '') { return pValue; }
		}
		return '';
	}

	//============================================================
	//Utility functions
	//------------------------------------------------------------
	//Syntax: All get functions must start with 'Get' wording
	//============================================================
	this.GetUTCDateOrEmptyString = function (pValue) {
		//This function operates based on below cases
		//new Date(undefined) = 'Invalid Date'
		//new Date(null).toUTCString() = 'Thu, 01 Jan 1970 00:00:00 GMT'
		try {
			if (pValue == 'now') {
				return (new Date()).toUTCString();
			}

			if (this.CEmptyString(pValue) == PJSON.EmptyString) { return PJSON.EmptyString; }
			var vUTCDate = new Date(pValue);
			var vReturnValue = vUTCDate.toUTCString();
			if (vReturnValue == 'Invalid Date')
				return PJSON.EmptyString;
			else
				return vReturnValue;
		}
		catch (ex) {
			return this.EmptyString;
		}
	}

	this.GetWinFileNameStringOrEmptyString = function (pValue) {
		//non allowed characters for file name: \/:*?"<>|
		//Additionally commas & spaces are also removed
		try {
			pValue = this.CEmptyString(pValue);
			if (pValue != this.EmptyString) {
				pValue = pValue.replace(/\\/g, '')
						.replace(/\//g, '')
						.replace(/':'/g, '')
						.replace(/'*'/g, '')
						.replace(/'?'/g, '')
						.replace(/'"'/g, '')
						.replace(/'<'/g, '')
						.replace(/'>'/g, '')
						.replace(/'|'/g, '')
						.replace(/,/g, '')
						.replace(/ /g, '');
			}
			return pValue;
		}
		catch (ex) {
			return this.EmptyString;
		}
	}

	this.GetDataConvertionFunctionName = function (pDataTypeValue) {
		var retFunctionName = '';
		switch (pDataTypeValue) {
			case PDataType.Integer:
				retFunctionName = 'PJSON.CInteger';
				break;
			case PDataType.Decimal:
				retFunctionName = 'PJSON.CDecimal';
				break;
			case PDataType.Date:
				retFunctionName = 'PJSON.CDateObj';
				break;
			case PDataType.Guid:
				retFunctionName = 'PJSON.CNullGuid';
				break;
			case PDataType.String:
				retFunctionName = 'PJSON.CNullString';
				break;
			case PDataType.NullableString:
				retFunctionName = 'PJSON.CNullString';
				break;
			case PDataType.EmptyString:
				retFunctionName = 'PJSON.CEmptyString';
				break;
			default:
				retFunctionName = 'PJSON.CNullString';
				break;
		}
		return retFunctionName;
	}

	this.GetAgeInYears = function (birthDate) {
		//birthDate in mm/dd/yyyy format.
		birthDate = new Date(birthDate);
		var nowDate = new Date();
		var age = nowDate.getFullYear() - birthDate.getFullYear();
		if (nowDate.getMonth() < birthDate.getMonth() || (nowDate.getMonth() == birthDate.getMonth() && nowDate.getDate() < birthDate.getDate())) {
			age--;
		}
		return age;
	}
	//====================================
	//GetAgeInMonths function returns patient age in months
	//This code has been copied from javascript function ReturnStringAge in patagonia.js which is used for displaying patient age in patient details header section. 
	//====================================
	this.GetAgeInMonths = function (startDate, endDate) {
		var ageYears = 0;
		var ageMonths = 0;
		var ageWeeks = 0;
		var ageDays = 0;
		var returnText = '';

		if (startDate == 'today') {
			startDate = (new Date()).toDateString();
		}
		if (endDate == 'today') {
			endDate = (new Date()).toDateString();
		}
		//Format Date in MM/DD/YYYY format
		startDate = jQGetDateTimeString('mm/dd/yy', startDate);
		endDate = jQGetDateTimeString('mm/dd/yy', endDate);

		var monthfield = startDate.split('/')[0];
		var dayfield = startDate.split('/')[1];
		var yearfield = startDate.split('/')[2];
		startDate = new Date(yearfield, monthfield - 1, dayfield);

		endDate = new Date(endDate);
		endDate.setHours(0, 0, 0, 0);

		var InitialDate = new Date();
		InitialDate.setFullYear(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

		ageYears = endDate.getFullYear() - InitialDate.getFullYear();

		if (
			(InitialDate.getMonth() > endDate.getMonth())
			||
			(
				(InitialDate.getMonth() == endDate.getMonth())
				&&
				(InitialDate.getDate() > endDate.getDate())
			 )
		   ) {
			ageYears--;
		}

		InitialDate.setFullYear(InitialDate.getFullYear() + ageYears, InitialDate.getMonth(), InitialDate.getDate());

		ageMonths = endDate.getMonth() - InitialDate.getMonth();

		if (InitialDate.getDate() > endDate.getDate())
			ageMonths--;

		if (ageMonths < 0)
			ageMonths = ageMonths + 12;

		tempMonths = (InitialDate.getMonth() + ageMonths);
		var tempYears = InitialDate.getFullYear();
		if (tempMonths > 11) {
			tempMonths = tempMonths % 12;
			tempYears++;
		}

		InitialDate.setFullYear(tempYears, tempMonths, InitialDate.getDate());

		var startDay = InitialDate.getDOY();
		var endDay = endDate.getDOY();
		var totalDays = 0;

		//If the startDate is later in the year that the endDate
		if (endDay < startDay) {
			//if a leap year
			if (isLeapYear(InitialDate.getFullYear()))
				totalDays = (366 - startDay) + endDay;
				//else
			else
				totalDays = (365 - startDay) + endDay;
		}
		else if (startDay < endDay)
			totalDays = endDay - startDay;
		//Return Age in months
		returnText = (12 * ageYears + ageMonths);
		return returnText;
	}


	//========================================
	//This function returns No.of Days difference between given two dates.
	//Returns days in integer (or) null in case of error 
	//========================================
	this.CalculateDayDifference = function (startDate, endDate) {
		var differedDays = null;
		try {
			var startDateObj = new Date(startDate);
			var endDateObj = new Date(endDate);
			differedDays = Math.round((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
		}
		catch (ex) {
			differedDays = null;
		}
		return differedDays;
	}


}
var PJSON = new PEMR_JSONOperations();


//===[ PEMR_GetTimeStamp ]======================================================
// Desc    : This function returns timestamp HH:MM format
// Syntax  : var <v1> = PEMR_GetTimeStamp();
//==============================================================================
function PEMR_GetTimeStamp() {
	var dtNow = new Date();
	var iMins = dtNow.getMinutes();
	var iHours = dtNow.getHours();

	var vMins = '00';
	if (iMins < 10) { if (iMins != 0) { vMins = '0' + iMins.toString(); } }
	else { vMins = iMins; }

	var vHours = '00';
	if (iHours < 10) { if (iHours != 0) { vHours = '0' + iHours.toString(); } }
	else { vHours = iHours; }

	return vHours + ':' + vMins;;
}


//===[ PEMR_GetComputedStartEndDate ]===========================================
// Desc    : This function can be used to return
//           01) Week  Start/End Date
//           02) Month Start/End Date
//           03) Year Start/End Date
//           based on date given.
// Returns : Date string
//------------------------------------------------------------------------------
// Note-01 : This function uses 'validateAnyDate' from 'DateValidator.js'
//           So, include that js file also for this function to work
// Note-02 : If given baseDateString='today' then its calculates from today
//------------------------------------------------------------------------------
// Syntax  : var <dateStringVar> = PEMR_GetComputedStartEndDate(<TITypeValue>, <bool>, <'today'>|<AnyValidDateString> );
// Example : var vDateString = PEMR_GetComputedStartEndDate(PTimeIntervalType.Weekly, true, 'today');
// Output  : Returns weeks starting date w.r.t todays date
//==============================================================================
function PEMR_GetComputedStartEndDate(timeInterval, isStartDate, baseDateString) {
	//First validate the inputs
	if (timeInterval != PTimeIntervalType.Weekly && timeInterval != PTimeIntervalType.Monthly && timeInterval != PTimeIntervalType.Yearly) {
		return false;
	}
	if (isStartDate != true && isStartDate != false) {
		return false;
	}
	if (baseDateString != 'today') {
		if (validateAnyDate(baseDateString) == false) {
			return false;
		}
	}
	else {
		baseDateString = (new Date()).toDateString();
	}

	//Now compute the week start date
	var vReturnDateString = null;
	switch (timeInterval) {
		case PTimeIntervalType.Weekly:
			var vBaseDate = new Date(baseDateString);
			var vWeekDay = vBaseDate.getDay();
			var vNewWeekDayDiff = null;
			if (isStartDate == true) {
				vNewWeekDayDiff = vBaseDate.getDate() - vWeekDay;
			}
			else {
				vNewWeekDayDiff = vBaseDate.getDate() + (6 - vWeekDay);
			}
			var vFinalDate = new Date(vBaseDate.setDate(vNewWeekDayDiff));
			vReturnDateString = vFinalDate.toDateString();
			break;
		case PTimeIntervalType.Monthly:
			var vBaseDate = new Date(baseDateString);
			var vFinalDate = null;
			if (isStartDate == true) {
				vFinalDate = new Date(vBaseDate.setDate(1));
			}
			else {
				var vNextMonthStartDate
					= new Date(vBaseDate.setMonth(vBaseDate.getMonth() + 1))
				vFinalDate = new Date(vNextMonthStartDate.setDate(0));
			}
			vReturnDateString = vFinalDate.toDateString();
			break;
		case PTimeIntervalType.Yearly:
			var vBaseDate = new Date(baseDateString);
			var vFinalDate = null;
			if (isStartDate == true) {
				var vStartDateString = '01/01/' + vBaseDate.getFullYear();
				vFinalDate = new Date(vStartDateString);
			}
			else {
				var vEndDateString = '12/31/' + vBaseDate.getFullYear();
				vFinalDate = new Date(vEndDateString);
			}
			vReturnDateString = vFinalDate.toDateString();
			break;
	}

	//return the date string
	return vReturnDateString;
}


//===[ PEMR_GetComputedDate ]===================================================
// Desc    : This function can be used to return computed date i.e.
//           01) +/- Days
//           02) +/- Months
//           03) +/- Years
//           from the given date.
// Returns : Date string
//------------------------------------------------------------------------------
// Note-01 : This function uses 'validateAnyDate' from 'DateValidator.js'
//           So, include that js file also for this function to work
// Note-02 : If given baseDateString='today' then its calculates from today
// Note-03 : To substract the values provide negative interval value
// Note-04 : TODO: Currently functionality ONLY FOR YEARS, MONTHS is provided, OTHERS NEEDS TO BE IMPLEMENTED
//------------------------------------------------------------------------------
// Syntax  : var <dateStringVar> = PEMR_GetComputedDate(<'today'>|<AnyValidDateString>, <[-]integerinterval> <TITypeValue>);
// Example : var vDateString = PEMR_GetComputedDate('today', PTimeIntervalType.Daily, -10);
// Output  : Returns the 10 days before datestring w.r.t today
//==============================================================================
function PEMR_GetComputedDate(baseDateString, timeIntervalType, interval) {
	//First validate the inputs
	if (baseDateString != 'today') {
		if (validateAnyDate(baseDateString) == false) {
			return false;
		}
	}
	else {
		baseDateString = (new Date()).toDateString();
	}
	var vBaseDate = new Date(baseDateString);
	//TODO: currently supports on
	if (timeIntervalType != PTimeIntervalType.Yearly && timeIntervalType != PTimeIntervalType.Monthly && timeIntervalType != PTimeIntervalType.Weekly && timeIntervalType != PTimeIntervalType.Daily) {
		return false;
	}

	//Compute the date
	var vFinalDate = null;
	switch (timeIntervalType) {
		case PTimeIntervalType.Daily:
			vFinalDate = new Date(vBaseDate.getFullYear(), vBaseDate.getMonth(), vBaseDate.getDate() + interval);
			break;
		case PTimeIntervalType.Weekly:
			var vIntervalInDays = 7 * interval;
			vFinalDate = new Date(vBaseDate.getFullYear(), vBaseDate.getMonth(), vBaseDate.getDate() + vIntervalInDays);
			break;
		case PTimeIntervalType.Monthly:
			vFinalDate = new Date(vBaseDate.getFullYear(), vBaseDate.getMonth() + interval, vBaseDate.getDate());
			break;
		case PTimeIntervalType.Yearly:
			vFinalDate = new Date(vBaseDate.getFullYear() + interval, vBaseDate.getMonth(), vBaseDate.getDate());
			break;
	}

	//return the date string
	return vFinalDate.toString();
}


//===[ PEMR_jQSEDatePickers_BeforeShow ]==========================================
// Desc    : This function can be used to get the allowable date-ranges
//           if 2 controls are interdependant on each other Ex. Start & End Dates
//           But, when used in the 'beforeShow' event of 'datepicker' we can restrict date-selection
// Returns : { 'minDate': <dateObj>, 'maxDate': <dateObj> }
//------------------------------------------------------------------------------
// Note-01 : Since it uses jQuery Date-picker, make sure to include respective Code & UI libraries
//------------------------------------------------------------------------------
// P01: currentControlId      : NOT-NULL, Pass control-id in which the user clicked
// P02: defaultFromDateString : NOT-NULL, 'today' or 'Default date in string format'
// P03: minFromDateString     : NULLABLE, if null is given then user can select any past date,
//                              else restricted to this value. RECOMMENDED(null)
// P04: maxFromDateString     : NULLABLE, if null is given then 'ToDate' Controls value is taken
//                              else restricted to this value. RECOMMENDED(null)
// P05: defaultToDateString   : NOT-NULL, 'today' or 'Default date in string format'
// P06: minToDateString       : NULLABLE, if null is given then 'FromDate' Controls value is taken
//                              else restricted to this value. RECOMMENDED(null)
// P07: maxToDateString       : NULLABLE, if null is given then user can select any future date,
//                              else restricted to this value. RECOMMENDED('today')
// P08: fromInputId           : NOT-NULL, The fromDate Input control ID
// P09: fromInputId           : NOT-NULL, The toDate Input control ID
// P10: fromDateFormat        : NOT-NULL, From date format string given for the datepicker
// P11: toDateFormat          : NOT-NULL, To date format string given for the datepicker
//------------------------------------------------------------------------------
// Syntax  : Call this in beforeShow event as shown below
//           $('#<ControlName>').datepicker({
//              beforeShow: function(){
//                  //Write code to identify min, max dates and call
//                  return jQDatePickers_BeforeShow(....);
//              }
//           });
//------------------------------------------------------------------------------
// Example : To allow user to select from & to dates with to date not more than today
//           and from date should be always less than or equals to to date.
//           $('#<ControlName>').datepicker({
//              beforeShow: function(){
//                  //Write code to identify the controlId
//                  return PEMR_jQSEDatePickers_BeforeShow(input.id,
//		                'today', null, null,
//		                'today', null, 'today',
//		                vFromInputId, vToInputId, 'mm/dd/yy', 'mm/dd/yy');
//              }
//           });
//==============================================================================
function PEMR_jQSEDatePickers_BeforeShow(currentControlId,
	defaultFromDateString, minFromDateString, maxFromDateString,
	defaultToDateString, minToDateString, maxToDateString,
	fromInputId, toInputId, fromDateFormat, toDateFormat) {
	//Note month name is not specified externally
	//the date is assumed to be in the format mm/dd/yyy

	//Check if the controlIds are valid
	if ($('#' + currentControlId).length == 0
		|| $('#' + fromInputId).length == 0
		|| $('#' + toInputId).length == 0) {
		return false;
	}

	//Validate the input params values
	var todayDate = new Date();
	var todayDateString = jQGetDateTimeString('mm/dd/yy', todayDate.toString());

	//Default From & To dates are mandatory.
	var defaultFromDate = null;
	if (defaultFromDateString == 'today') { defaultFromDateString = todayDateString; }
	if (validateAnyDate(defaultFromDateString) == false) { return false; }
	defaultFromDate = new Date(defaultFromDateString);

	var defaultToDate = null;
	if (defaultToDateString == 'today') { defaultToDateString = todayDateString; }
	if (validateAnyDate(defaultToDateString) == false) { return false; }
	defaultToDate = new Date(defaultToDateString);

	//minFromDate, maxFromDate are ignored from validation if null is given as value
	var minFromDate = null;
	if (minFromDateString == 'today') { minFromDateString = todayDateString; }
	if (minFromDateString != null) {
		if (validateAnyDate(minFromDateString) == false) { return false; }
		minFromDate = new Date(minFromDateString);
	}
	var maxFromDate = null;
	if (maxFromDateString == 'today') { maxFromDateString = todayDateString; }
	if (maxFromDateString != null) {
		if (validateAnyDate(maxFromDateString) == false) { return false; }
		maxFromDate = new Date(maxFromDateString);
	}

	//minToDate, maxToDate are ignored from validation if null is given as value
	var minToDate = null;
	if (minToDateString == 'today') { minToDateString = todayDateString; }
	if (minToDateString != null) {
		if (validateAnyDate(minToDateString) == false) { return false; }
		minToDate = new Date(minToDateString);
	}
	var maxToDate = null;
	if (maxToDateString == 'today') { maxToDateString = todayDateString; }
	if (maxToDateString != null) {
		if (validateAnyDate(maxToDateString) == false) { return false; }
		maxToDate = new Date(maxToDateString);
	}


	//Validate the dates in the controls
	//Here if the value in from & to date textboxes is a valid date, then
	//that value is loaded else the default date is loaded.
	var fromDate = null;
	var fromDateString = $('#' + fromInputId).val();
	if (validateAnyDate(fromDateString) == false) {
		fromDate = defaultFromDate;
	}
	else {
		fromDate = new Date(fromDateString);
	}

	var toDate = null;
	var toDateString = $('#' + toInputId).val();
	if (validateAnyDate(toDateString) == false) {
		toDate = defaultToDate;
	}
	else {
		toDate = new Date(toDateString);
	}


	//Set the validated dates back in the controls with their respective format
	if (fromDateFormat == undefined || fromDateFormat == '' || fromDateFormat == null) {
		fromDateFormat = 'mm/dd/yy';
	}
	fromDateString = jQGetDateTimeString(fromDateFormat, fromDate);
	$('#' + fromInputId).val(fromDateString);
	if (toDateFormat == undefined || toDateFormat == '' || toDateFormat == null) {
		toDateFormat = 'mm/dd/yy';
	}
	toDateString = jQGetDateTimeString(toDateFormat, toDate);
	$('#' + toInputId).val(toDateString);

	//Set the max and min dates
	var dateMin = null;
	var dateMax = null;
	if (currentControlId == toInputId) {
		dateMin = fromDate;
	}
	if (currentControlId == fromInputId) {
		dateMax = toDate;
	}


	//Validate the min max ranges based on the ranges given
	//if null is sent form minToDate, then for fromDate is considered, IT IS DEFAULT BEHAVIOR
	//if minToDate is given and if fromDate is less than minToDate, then minToDate is considered
	if (currentControlId == toInputId) {
		if (minToDate != null) {
			if (dateMin == null || dateMin < minToDate) {
				dateMin = minToDate;
			}
		}
		if (maxToDate != null) {
			if (dateMax == null || dateMax > maxToDate) {
				dateMax = maxToDate;
			}
		}
	}
	if (currentControlId == fromInputId) {
		if (minFromDate != null) {
			if (minFromDate == null || dateMin < minFromDate) {
				dateMin = minFromDate;
			}
		}
		if (maxFromDate != null) {
			if (maxFromDate == null || dateMax > maxFromDate) {
				dateMax = maxFromDate;
			}
		}
	}

	//return the final values
	return {
		minDate: dateMin,
		maxDate: dateMax
	};
}


//===[ PEMR_ShowStatusMessage ]=================================================
// Desc    : Displays the given message html in given color format
//           for 'timeOutDuration' duration.
// Syntax  : Call this in your local javascript files as below
//           PEMR_ShowStatusMessage('#<controlName>'
//           , <FEESCH_ColorType>, <FEESCH_ColorType>
//           , <MessageHtml/NormalText>
//           , <StandardMessageFadeDuration>, <StandardMessageTimoutDuration>);
//==============================================================================
var PEMR_StandardMessageFadeDuration = 1000;
var PEMR_StandardMessageTimoutDuration = 60000;
function PEMR_ShowStatusMessage(controlID, backgroundColorCode, textColorCode, messageHtml, fadeDuration, timeOutDuration, timeOutHandle) {
	messageHtml = PJSON.CEmptyString(messageHtml);
	try {
		$('#' + controlID).finish();
		$('#' + controlID).stop();
		if (typeof (timeOutHandle) != 'undefined' && timeOutHandle != null) { clearTimeout(timeOutHandle); }
	} catch (ex) { }
	$('#' + controlID).css({ 'background-color': backgroundColorCode, 'color': textColorCode });
	$('#' + controlID).html(messageHtml).fadeIn(fadeDuration);
	var timeOutHandle = setTimeout(function () { $('#' + controlID).fadeOut(fadeDuration); }, timeOutDuration);
	return timeOutHandle;
}
function PEMR_HideStatusMessage(controlID, timeOutHandle) {
	try {
		$('#' + controlID).finish();
		$('#' + controlID).stop();
		if (typeof (timeOutHandle) != 'undefined' && timeOutHandle != null) { clearTimeout(timeOutHandle); }
		$('#' + controlID).html('');
		$('#' + controlID).hide();
	} catch (ex) { }
}
function PEMR_ShowStandardStatusMessage(messageType, controlID, messageHtml, timeOutHandle) {
	switch (messageType) {
		case PMessageType.Notification:
			timeOutHandle = PEMR_ShowStatusMessage(controlID,
				PColorType.Palette01_Yellow, PColorType.Black, messageHtml,
				PEMR_StandardMessageFadeDuration, PEMR_StandardMessageTimoutDuration, timeOutHandle);
			break;
		case PMessageType.Success:
			timeOutHandle = PEMR_ShowStatusMessage(controlID,
				PColorType.Palette01_Green, PColorType.Black, messageHtml,
				PEMR_StandardMessageFadeDuration, PEMR_StandardMessageTimoutDuration, timeOutHandle);
			break;
		case PMessageType.Error:
			timeOutHandle = PEMR_ShowStatusMessage(controlID,
				PColorType.Palette01_Orange, PColorType.Black, messageHtml,
				PEMR_StandardMessageFadeDuration, PEMR_StandardMessageTimoutDuration, timeOutHandle);
			break;
	}
	return timeOutHandle;
}

function PEMR_HideAutoTOHMessage(selector) {
	var $selector = $(selector);
	if ($selector.length <= 0) { return false; }
	try {
		$selector.finish();
		$selector.stop();
		var timeOutHandle = PJSON.CDecimal($selector.data('timoutHandle'));
		if (typeof (timeOutHandle) != 'undefined' && timeOutHandle != null) { clearTimeout(timeOutHandle); }
		$selector.removeData('timoutHandle');
		$selector.html('');
		$selector.hide();
	} catch (ex) { }
}
function PEMR_ShowAutoTOHMessage_Success(selector, messageHtml) {
	try {
		messageHtml = PJSON.CEmptyString(messageHtml);
		var $selector = $(selector);
		if ($selector.length <= 0) { return false; }
		try {
			$selector.finish();
			$selector.stop();
			var timeOutHandle = PJSON.CDecimal($selector.data('timoutHandle'));
			if (typeof (timeOutHandle) != 'undefined' && timeOutHandle != null) { clearTimeout(timeOutHandle); }
			$selector.removeData('timoutHandle');
		} catch (ex) { }
		$selector.css({ 'background-color': PColorType.Palette01_Green, 'color': PColorType.Black });
		$selector.html(messageHtml).fadeIn(PEMR_StandardMessageFadeDuration);
		var timeOutHandle = setTimeout(function () { $selector.fadeOut(PEMR_StandardMessageFadeDuration); }, PEMR_StandardMessageTimoutDuration);
		$selector.data('timoutHandle', timeOutHandle);
	}
	catch (ex) {
		console.log(ex);
	}
}
function PEMR_ShowAutoTOHMessage_Notification(selector, messageHtml) {
	try {
		messageHtml = PJSON.CEmptyString(messageHtml);
		var $selector = $(selector);
		if ($selector.length <= 0) { return false; }
		try {
			$selector.finish();
			$selector.stop();
			var timeOutHandle = PJSON.CDecimal($selector.data('timoutHandle'));
			if (typeof (timeOutHandle) != 'undefined' && timeOutHandle != null) { clearTimeout(timeOutHandle); }
			$selector.removeData('timoutHandle');
		} catch (ex) { }
		$selector.css({ 'background-color': PColorType.Palette01_Yellow, 'color': PColorType.Black });
		$selector.html(messageHtml).fadeIn(PEMR_StandardMessageFadeDuration);
		var timeOutHandle = setTimeout(function () { $selector.fadeOut(PEMR_StandardMessageFadeDuration); }, PEMR_StandardMessageTimoutDuration);
		$selector.data('timoutHandle', timeOutHandle);
	}
	catch (ex) {
		console.log(ex);
	}
}
function PEMR_ShowAutoTOHMessage_Error(selector, messageHtml) {
	try {
		messageHtml = PJSON.CEmptyString(messageHtml);
		var $selector = $(selector);
		if ($selector.length <= 0) { return false; }
		try {
			$selector.finish();
			$selector.stop();
			var timeOutHandle = PJSON.CDecimal($selector.data('timoutHandle'));
			if (typeof (timeOutHandle) != 'undefined' && timeOutHandle != null) { clearTimeout(timeOutHandle); }
			$selector.removeData('timoutHandle');
		} catch (ex) { }
		$selector.css({ 'background-color': PColorType.Palette01_Orange, 'color': PColorType.Black });
		$selector.html(messageHtml).fadeIn(PEMR_StandardMessageFadeDuration);
		var timeOutHandle = setTimeout(function () { $selector.fadeOut(PEMR_StandardMessageFadeDuration); }, PEMR_StandardMessageTimoutDuration);
		$selector.data('timoutHandle', timeOutHandle);
	}
	catch (ex) {
		console.log(ex);
	}
}


//========[Firebug Console Logging]=============================================
// Call this functions to Log messages in the Fire Bug Console
// PEMR_LogInFBC(functionName, message)
//     : Call this function to log your custom messages
//
// PEMR_LogInFBC_LocalHost(functionName, message)
//     : Call this function to log message while working in localhost mode
//
// PEMR_LogInFBC_TryCatchObject(functionName, exceptionCatchObject)
//     : Call this function while logging from a try-catch block
//
// PEMR_LogInFBC_WCFError(functionName, jqXHR, textStatus, errorThrown)
//     : Call this function while logging from a WCF service call - error
//==============================================================================
function PEMR_LogInFBC(functionName, message) {
	if (window.console && window.console.log) {
		console.info(functionName + ' : ');
		console.log(message);
	}
}
function PEMR_LogInFBC_LocalHost(functionName, message) {
	var currentUrl = window.location.protocol
		+ '//' + window.location.host;
	if (currentUrl == 'http://localhost:2238') {
		PEMR_LogInFBC(functionName, message);
	}
}
function PEMR_LogInFBC_TryCatchObject(functionName, exceptionCatchObject) {
	var exMsg = 'Exception : ' + exceptionCatchObject.message;
	PEMR_LogInFBC(functionName, exMsg);
}
function PEMR_LogInFBC_WCFError(functionName, jqXHR, textStatus, errorThrown) {
	var exMsg = 'XMLHttpRequest[' + JSON.stringify(jqXHR) + ']'
		+ ', textStatus[' + textStatus + ']'
		+ ', errorThrown[' + errorThrown + ']';
	PEMR_LogInFBC(functionName, exMsg);
}


// /**
// * Cookie plugin
// *
// * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
// * Dual licensed under the MIT and GPL licenses:
// * http://www.opensource.org/licenses/mit-license.php
// * http://www.gnu.org/licenses/gpl.html
// *
// */

jQuery.cookie = function (name, value, options) {
	if (typeof value != 'undefined' || (name && typeof name != 'string')) { // name and value given, set cookie
		if (typeof name == 'string') {
			options = options || {};
			if (value === null) {
				value = '';
				options.expires = -1;
			}
			var expires = '';
			if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
				var date;
				if (typeof options.expires == 'number') {
					date = new Date();
					date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
				} else {
					date = options.expires;
				}
				expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
			}
			// CAUTION: Needed to parenthesize options.path and options.domain
			// in the following expressions, otherwise they evaluate to undefined
			// in the packed version for some reason...
			var path = options.path ? '; path=' + (options.path) : '';
			var domain = options.domain ? '; domain=' + (options.domain) : '';
			var secure = options.secure ? '; secure' : '';
			document.cookie = name + '=' + encodeURIComponent(value) + expires + path + domain + secure;
		} else { // `name` is really an object of multiple cookies to be set.
			for (var n in name) { jQuery.cookie(n, name[n], value || options); }
		}
	} else { // get cookie (or all cookies if name is not provided)
		var returnValue = {};
		if (document.cookie) {
			var cookies = document.cookie.split(';');
			for (var i = 0; i < cookies.length; i++) {
				var cookie = jQuery.trim(cookies[i]);
				// Does this cookie string begin with the name we want?
				if (!name) {
					var nameLength = cookie.indexOf('=');
					returnValue[cookie.substr(0, nameLength)] = decodeURIComponent(cookie.substr(nameLength + 1));
				} else if (cookie.substr(0, name.length + 1) == (name + '=')) {
					returnValue = decodeURIComponent(cookie.substr(name.length + 1));
					break;
				}
			}
		}
		return returnValue;
	}
};

$.fn.setCursorPosition = function (position) {
	if (this.lengh == 0) return this;
	return $(this).setSelection(position, position);
}

$.fn.setSelection = function (selectionStart, selectionEnd) {
	if (this.lengh == 0) return this;
	input = this[0];

	if (input.createTextRange) {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character', selectionEnd);
		range.moveStart('character', selectionStart);
		range.select();
	} else if (input.setSelectionRange) {
		input.focus();
		input.setSelectionRange(selectionStart, selectionEnd);
	}

	return this;
}
// Move cursor to end of the input element in auto-suggest popup
$.fn.focusEnd = function () {
	this.setCursorPosition(this.val().length);
}

function GetPracticeID() {
	var $hiddenPracticeID = $('input[id$="HiddenPracticeID"]');
	var $pdgPracticeID = $('#PDG_PracticeID');
	var pracid;

	if ($hiddenPracticeID.val() != undefined)
		pracid = $hiddenPracticeID.val();
	else if ($pdgPracticeID.val() != undefined)
		pracid = $pdgPracticeID.val();
	else if (typeof PracticeID != "undefined")//if variable is not defined then typeof returns "undefined" string.
		pracid = PracticeID;
	else if (typeof PRACTICE_ID != "undefined")
		pracid = PRACTICE_ID;

	return pracid;
}

var getUserName = function () { //current user might be set as provider
	try {
		// On the page header, user name is displayed. Get that to display the name
		return $('[id$="_lblPracticeUserName"] span').text();
	}
	catch (e) {
		return '';
	}
}

var getPracticeName = function () {
	try {
		return $('[id$="lblPracticeName"]').html();
	}
	catch (e) {
		return '';
	}
}

// this function posts a message for the server
// Message is logged into a separate log file
// used for tracking client-side errors
var postErrorToServer = function (messageToPost) {
	var u = window.location.protocol + "//" + window.location.host + "/Services/UtilityFunctionsProxy.svc/PostErrorToServer";
	console.log('url: ' + u);
	$.ajax({
		type: "POST",
		url: u
	, data: JSON.stringify(messageToPost.toSource()) // Convert the object into a string
	, contentType: "application/json; charset=utf-8"
	, timeout: 3e4, dataType: "json"
	});
}

//Send results of window.onerror to server for DB storage
var postErrorToServerDatabase = function (applicationErrorsDTO) {
	var url = "/Services/UtilityFunctionsProxy.svc/PostErrorToServerDatabase";

	$.ajax({
		type: "POST",
		url: url,
		data: JSON.stringify(applicationErrorsDTO),
		contentType: "application/json; charset=utf-8",
		timeout: 3e4,
		datatype: "json"
	});
}

//Send results of window.onerror to server for CSV storage
var postErrorToServerCSV = function (applicationErrorsDTO) {
    var url = "/Services/UtilityFunctionsProxy.svc/PostErrorToServerCSV";
    var dateTimeStamp = '"' + new Date().toLocaleString('en-US').replace(',', '') + '"';

    var errorCSV = applicationErrorsDTO.ErrorMessage + "," + applicationErrorsDTO.LineNumber +
        "," + applicationErrorsDTO.CharacterNumber + "," + applicationErrorsDTO.UserID + "," +
        applicationErrorsDTO.PracticeID + "," + applicationErrorsDTO.URL + "," + dateTimeStamp;

    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(errorCSV),
        contentType: "application/json; charset=utf-8",
        timeout: 3e4,
        datatype: "json"
    });

}

USER_IS_ADMINISTRATOR = null;
// function will optionally call a callback function
var globalIsUserPracticeAdmin = function (callback) {
	// if this value has been set in the current session, return that value
	if (USER_IS_ADMINISTRATOR != null)
		return USER_IS_ADMINISTRATOR;
	// otherwise, make a service call
	var serviceURL = '/Services/UtilityFunctionsProxy.svc/IsUserPracticeAdmin';
	$.ajax({
		url: serviceURL
		, type: 'GET'
		, contentType: 'application/json; charset=utf-8'
		, timeout: 3e4
		, dataType: 'json'
		, success: function (returnData) {
			if (returnData == true)
				USER_IS_ADMINISTRATOR = true;
			else
				USER_IS_ADMINISTRATOR = false;
		}
		, complete: function () {
			if (callback != 'undefined' && typeof (callback) == 'function') {
				callback();
			}
		}
	});
}


//===============================================================
//--------------------[DATA OBJECTS SECTION]---------------------
//===============================================================
//NOTE: This object is placed here so that we can create object
//      any where, new properties can be added later
//Currently by placing code here, to prevent it from replication
// in PN & EN widgets
function PEMR_Object_ReportParamsType() {
	this.PatientID = null;
	this.PatientEncounterID = null;
	this.EsbID = null;
	this.ProviderID = null;
}
function PEMR_Object_ReportParamsType_FormatValues(pObject) {
	pObject.PatientID = PJSON.CDefaultGuid(pObject.PatientID);
	pObject.PatientEncounterID = PJSON.CDefaultGuid(pObject.PatientEncounterID);
	pObject.EsbID = PJSON.CDefaultGuid(pObject.EsbID);
	pObject.ProviderID = PJSON.CDefaultGuid(pObject.ProviderID);
}


//========[PEMR_FormUserName]===================================================
// Desc    : Use this function to form name string based on first, middle & last name
// Syntax  : var <nameVar> = PEMR_FormUserName(fName, mName, lName);
// Returns : LastName, FirstName MiddleName
//==============================================================================
var PEMR_FormUserName = function (firstName, middleName, lastName) {
	//First convert the strings
	firstName = PJSON.CEmptyString(firstName);
	middleName = PJSON.CEmptyString(middleName);
	lastName = PJSON.CEmptyString(lastName);

	//Form the name string in the format: Last, First Middle
	var returnName = lastName;
	returnName += (firstName == PJSON.EmptyString) ? PJSON.EmptyString : ', ' + firstName
	returnName += (middleName == PJSON.EmptyString) ? PJSON.EmptyString : ' ' + middleName;

	//Return the final name string
	return $.trim(returnName);
}

//========[PEMR_TitleCaseString]===================================================
// Desc    : Use this function to convert a string sentence or name in title case, 
//           e.g. input: 'andrew JACKSON' output: 'Andrew Jackson'
// Syntax  : var <somestring> = PEMR_TitleCaseString(someOtherString);
// Returns : string
//==============================================================================
var PEMR_TitleCaseString = function (stringToFormat) {
    stringToFormat = stringToFormat.toLowerCase();

    stringToFormatArray = stringToFormat.split(" ");

    stringToFormatArray = stringToFormatArray.map(function (val) {
        val = val.charAt(0).toUpperCase() + val.slice(1);
        return val;
    });

    stringToFormat = stringToFormatArray.join(" ");

    return stringToFormat;
}

//========[PEMR_BHFormUserName]===================================================
// Desc    : Use this function to form user-name string
//           based on first & last names for display in BH Forms
// Syntax  : var <nameVar> = PEMR_BHFormUserName(fName, lName);
// Returns : FirstName LastName
//==============================================================================
var PEMR_FormBHUserName = function (firstName, lastName) {
	//First convert the strings
	firstName = PJSON.CEmptyString(firstName);
	lastName = PJSON.CEmptyString(lastName);

	//Form the name string in the format: Last, First Middle
	var returnName = firstName + ' ' + lastName;

	//Return the final name string
	return $.trim(returnName);
}


//========[PEMR_GetFMLConcatenatedNameBySpaces]=================================
// Desc    : Use this function to form name string seperated by spaces
// Syntax  : var <nameVar> = PEMR_GetFMLConcatenatedNameBySpaces(fName, mName, lName);
// Returns : FirstName MiddleName LastName
//==============================================================================
var PEMR_GetFMLConcatenatedNameBySpaces = function (firstName, middleName, lastName) {
	var returnName = '';

	//First convert the strings
	firstName = PJSON.CEmptyString(firstName);
	middleName = PJSON.CEmptyString(middleName);
	lastName = PJSON.CEmptyString(lastName);

	//Join the strings and return
	var returnName = firstName;
	returnName += (middleName == PJSON.EmptyString) ? PJSON.EmptyString : ' ' + middleName;
	returnName += (lastName == PJSON.EmptyString) ? PJSON.EmptyString : ' ' + lastName;

	return $.trim(returnName);
}


//========[PEMR_GetDurationSelect_UTCStartAndEndDates]==========================
// Desc    : Use this function to find the start & end dates for the selected
//           duration option.
//           The function assumes that the parameters are in below specified
//           format and hence validations in this function are not done.
//           In such scenario null will be returned.
// Syntax  : var <nameVar> = PEMR_GetStartAndEndDatesByDuration(selectedOption);
// Returns : An object of structure {
//             Duration: <dString>, StartDate : <sdString>, EndDate : <edString>
//           }
//           (or)
//           null, in case of exception
// Paramerters:
// P01 : todayString   : is any valid date format that can be parsed by
//                       JS Date Object | 'today'.
// P02 : sortColumn    : is any valid value of PEMR_DurationSelectType
//==============================================================================
var PEMR_GetDurationSelect_UTCStartAndEndDates = function (todayString, durationSelectType) {
	try {
		if (todayString == 'today') {
			todayString = jQGetDateTimeString('mm/dd/yy', new Date().toString());
		}

		var today = new Date(todayString);
		var todayDate = today.getDate();
		var todayMonth = today.getMonth();
		var todayFullYear = today.getFullYear();

		var compSDString = '';
		var compEDString = todayString;
		switch (durationSelectType) {
			case PDurationSelectType.All:
				compSDString = null;
				compEDString = null;
				break;
			case PDurationSelectType.Today:
				compSDString = todayString;
				break;
			case PDurationSelectType.Week:
				compSDString = new Date(todayFullYear, todayMonth, (todayDate - 6)).toDateString();
				break;
			case PDurationSelectType.Month:
				compSDString = new Date(todayFullYear, (todayMonth - 1), todayDate).toDateString();
				break;
			case PDurationSelectType.TwoMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 2), todayDate).toDateString();
				break;
			case PDurationSelectType.ThreeMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 3), todayDate).toDateString();
				break;
			case PDurationSelectType.FourMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 4), todayDate).toDateString();
				break;
			case PDurationSelectType.FiveMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 5), todayDate).toDateString();
				break;
			case PDurationSelectType.SixMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 6), todayDate).toDateString();
				break;
			case PDurationSelectType.SevenMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 7), todayDate).toDateString();
				break;
			case PDurationSelectType.EightMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 8), todayDate).toDateString();
				break;
			case PDurationSelectType.NineMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 9), todayDate).toDateString();
				break;
			case PDurationSelectType.TenMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 10), todayDate).toDateString();
				break;
			case PDurationSelectType.ElevenMonths:
				compSDString = new Date(todayFullYear, (todayMonth - 11), todayDate).toDateString();
				break;
			case PDurationSelectType.TwelveMonths:
				compSDString = new Date((todayFullYear - 1), todayMonth, todayDate).toDateString();
				break;
			case PDurationSelectType.TwoYears:
				compSDString = new Date((todayFullYear - 2), todayMonth, todayDate).toDateString();
				break;
			case PDurationSelectType.ComingMonth:
				compEDString = new Date(todayFullYear, (todayMonth + 1), todayDate).toDateString();
				break;
			case PDurationSelectType.ComingWeek:
				compEDString = new Date(todayFullYear, todayMonth, (todayDate + 6)).toDateString();
				break;
			case PDurationSelectType.AllUpcoming:
				compEDString = new Date((todayFullYear + 2), todayMonth, todayDate).toDateString();
				break;
			case PDurationSelectType.Range:
				//Do nothing as the start and ends needs to be assigned explicitly
				break;
		}

		//Now find the start and end date UTC equivalents
		if (durationSelectType == PDurationSelectType.ComingMonth || durationSelectType == PDurationSelectType.ComingWeek || durationSelectType == PDurationSelectType.AllUpcoming) {
			//Add one day to end date
			compSDString = new Date(todayFullYear, todayMonth, (todayDate + 1)).toDateString();
			//In order to eliminate 4 hours difference
			//Add 4 hours to start date and end date,so that even encounter/form created with previous day date time till 11:59 PM,it will be less than 4:00 AM of next day
			compSDString = new Date(compSDString + ' 04:00:00');
			compEDString = new Date(compEDString + ' 04:00:00');
		}
		else if (durationSelectType != PDurationSelectType.All) {
			//Add one day to end date
		    compEDString = new Date(todayFullYear, todayMonth, (todayDate + 1)).toDateString();
		    //In order to eliminate 4 hours difference
		    //Add 4 hours to start date and end date,so that even encounter/form created with previous day date time till 11:59 PM,it will be less than 4:00 AM of next day
		    compSDString = new Date(compSDString + ' 04:00:00');
		    compEDString = new Date(compEDString + ' 04:00:00');
		}

		return {
			Duration: durationSelectType,
			StartDate: jQGetDateTimeString('m/d/yy default24hms', compSDString),
			EndDate: jQGetDateTimeString('m/d/yy default24hms', compEDString)
		};
	}
	catch (ex) {
		return null;
	}
}


//========[PEMR_GetArraySortFunction]===========================================
// Desc    : Use this function to determine the sort function for any array
//           based on the given parameters
// Returns : PEMR_JSONOperations datatype conversion function name
//           (or) null - in case of improper-param values
// Paramerters:
// P01 : functionPrefix: Any prefix you like for the sort function, make sure
//                       it is unique in the DOM loaded
// P02 : sortColumn    : A valid column name exisiting in the array object
// P03 : sortOrder     : Any value of PEMR_SortType
// P03 : sortDataType  : Any value of PEMR_DataType
//==============================================================================
function PEMR_GetArrayDataSortFunction(functionPrefix, sortColumn, sortOrder, sortDataType) {
	try {
		functionPrefix = PJSON.CEmptyString(functionPrefix);
		if (functionPrefix == '') {
			PEMR_LogInFBC('PEMR_GetArrayDataSortFunction', 'functionPrefix cannot be empty.');
			return null;
		}
		sortColumn = PJSON.CEmptyString(sortColumn);
		if (sortColumn == '') {
			PEMR_LogInFBC('PEMR_GetArrayDataSortFunction', 'sortColumn cannot be empty.');
			return null;
		}
		sortOrder = PJSON.CEmptyString(sortOrder);
		if (sortOrder == '') {
			PEMR_LogInFBC('PEMR_GetArrayDataSortFunction', 'sortOrder cannot be empty.');
			return null;
		}
		sortDataType = PJSON.CEmptyString(sortDataType);
		if (sortDataType == '') {
			PEMR_LogInFBC('PEMR_GetArrayDataSortFunction', 'sortDataType cannot be empty.');
			return null;
		}

		sortOrder = PSortType.Convert(sortOrder);
		sortDataType = PDataType.Convert(sortDataType);
		var sortFunction = PJSON.GetDataConvertionFunctionName(sortDataType);
		if (sortOrder == PSortType.Asc) {
			sortCode = ' if (lov > rov) { retValue = 1; } else if (lov < rov) { retValue = -1; } ';
		}
		else {
			sortCode = ' if (lov > rov) { retValue = -1; } else if (lov < rov) { retValue = 1; } ';
		}

		var functionDef = ''
			+ ' function functionPrefix_#sortColumn#_#sortOrder#_#sortDataType#(lo, ro){ '
			+ ' var lov = #sortFunction#(lo.#sortColumn#); '
			+ ' var rov = #sortFunction#(ro.#sortColumn#); '
			+ ' var retValue = 0; '
			+ sortCode
		//+ ' PEMR_LogInFBC("functionPrefix_#sortColumn#_#sortOrder#_#sortDataType#","Sorting values ("+ lo.#sortColumn# +")("+ ro.#sortColumn# +")=("+ retValue +")");'
			+ ' return retValue; '
			+ '}'
		functionDef = functionDef.replace(/#sortColumn#/gi, sortColumn);
		functionDef = functionDef.replace(/#sortOrder#/gi, sortOrder);
		functionDef = functionDef.replace(/#sortDataType#/gi, sortDataType);
		functionDef = functionDef.replace(/#sortFunction#/gi, sortFunction);

		//PEMR_LogInFBC('PEMR_GetArrayDataSortFunction', functionDef);
		var retFunction = null;
		eval('retFunction = ' + functionDef);
		if (typeof (retFunction) != 'function') {
			retFunction = null;
		}
		return retFunction;
	}
	catch (ex) {
		PEMR_LogInFBC_TryCatchObject('PEMR_GetArrayDataSortFunction', ex);
		throw ex;
	}
}

function PEMR_GetTextAreaHtml(strText) {
	strText = strText.replace(/\n/g, '<br/>');
	return strText;
}
function PEMR_UnescapeHtml(cellval, opts, rowObj) {
	// Encounter list values are escaped HTML,unescape HTML for display
	var x = unescape(cellval);
	//Shorten the string length for display
	if (x.length > 35) {
		x = x.substr(0, 25);
		x += '...';
	}
	return '<span title="' + cellval + '">' + x + '</span>';
}


//http://stackoverflow.com/questions/1050720/adding-hours-to-javascript-date-object
function PEMR_DateTime_AddHours(dateObj, hours) {
	var newDateObj = new Date(dateObj.toString());
	newDateObj.setHours(newDateObj.getHours() + hours);
	return newDateObj;
}
function PEMR_DateTime_AddMinutes(dateObj, minutes) {
	var newDateObj = new Date(dateObj.toString());
	newDateObj.setMinutes(newDateObj.getMinutes() + minutes);
	return newDateObj;
}

//#region Multi Select
function PDG_GetCheckedComboValues(CntrlId) {
	var returnval = '';
	var array_of_checked_values = $('#' + CntrlId).multiselect("getChecked").map(function () {
		return this.value;
	}).get();
	if (array_of_checked_values.length > 0)
		$.each(array_of_checked_values, function (index, value) { returnval = returnval + "'" + value + "',"; });

	if (returnval != '')
		returnval = returnval.substr(0, returnval.length - 1);

	return returnval;
}
function PDG_SetCheckedComboValues(CntrlId, strValue) {
	$.each(strValue.split(','), function (index, value) {
		$('#' + CntrlId + ' option[value=' + value + ']').prop('selected', true);
	});
	$('#' + CntrlId).multiselect();
}
function PDG_PushCheckedComboValues(CntrlId, strValue, Type) { //Replaced Combo with span to avoid disable issue while binding multi select list
	var Chktxt = '';
	$.each(strValue.split(','), function (index, value) {
		Chktxt = Chktxt + $('#' + CntrlId + ' option[value=' + value + ']').text() + ",";
	});
	if (Chktxt != '')
		Chktxt = Chktxt.substring(0, Chktxt.length);
	else
		Chktxt = '&nbsp';
	if (Chktxt != '')
		Chktxt = Chktxt.substring(0, Chktxt.length - 1);
	if (Type == "Print") {
		$('#' + CntrlId)
			.replaceWith('<span style="width:368px;word-break:break-all;"overflow-y: auto; overflow-x: none;" id="' + CntrlId + '">' + Chktxt + '</span>');
	}
	else if (Type == "Report") {
		return Chktxt;
	}
}
//added  functions to call race and ethnicity from service level. Param1  returns whether "All" value required or not in Race and ethnicity dropdown List,Param2 returns 
//whether "Declined"  value required or not in Race and Ethnicity DropDown List.
function PDG_LoadRaceList(Param1, Param2) {

	var RaceOptions;
	if (Param1)
		RaceOptions = '<option value="0">All</option>';
	if (Param2 && Param1)
		RaceOptions += '<option value="-1">Declined</option>';
	else if (Param2)
		RaceOptions = '<option value="-1">Declined</option>';
	//Form the queryString
	var vUrl = window.location.protocol
			+ '//'
			+ window.location.host
			+ '/Services/GISServiceProxy.svc/GetRaces';
	$.ajax({
		url: vUrl,
		type: 'GET',
		async: false,
		success: function (data, textStatus, XMLHttpRequest) {
			var RaceResult = JSON.parse(data.GetRacesResult);

			if (RaceResult != undefined) {
				$.each(RaceResult, function (index, item) {
					RaceOptions += '<option value="' + item.value + '">' + item.label + '</option>';
				});
			}
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			//Show the message in the console
			PEMR_LogInFBC_WCFError('PDG_LoadRaceList', XMLHttpRequest, textStatus, errorThrown);
			RaceOptions = "";
		}
	});
	return RaceOptions;

}
function PDG_LoadEthnicityList(Param1, Param2) {

	var EthnicityOptions;
	if (Param1)
		EthnicityOptions = '<option value="0">All</option>';
	if (Param2 && Param1)
		EthnicityOptions += '<option value="-1">Declined</option>';
	else if (Param2)
		EthnicityOptions = '<option value="-1">Declined</option>';
	//Form the queryString
	var vUrl = window.location.protocol
			+ '//'
			+ window.location.host
			+ '/Services/GISServiceProxy.svc/GetEthnicities';
	$.ajax({
		url: vUrl,
		type: 'GET',
		async: false,
		success: function (data, textStatus, XMLHttpRequest) {
			var EthnicityResult = JSON.parse(data.GetEthnicitiesResult);

			if (EthnicityResult != undefined) {
				$.each(EthnicityResult, function (index, item) {

					EthnicityOptions += '<option value="' + item.value + '">' + item.label + '</option>';
				});


			}

		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			//Show the message in the console
			PEMR_LogInFBC_WCFError('PDG_LoadEthnicityList', XMLHttpRequest, textStatus, errorThrown);
			EthnicityOptions = "";
		}
	});
	return EthnicityOptions;
}
//#endregion Multi Select
var PEMR_Global = function ($) {
	var EncounterProviderList = null;
	var EncounterCallInProgress = 0;
	var EncounterProviderCallback = [];
	function PEMR_GetEncounterProviderList(callbackFunction) {

		if (this.EncounterProviderList != null) {
			callbackFunction(EncounterProviderList);
			return true;
		}
		if (this.EncounterCallInProgress = 1) {
			EncounterProviderCallback.push(callbackFunction);
			return true;
		}
		this.EncounterCallInProgress = 1;

		var proNames = window.location.protocol + "//" +
			   window.location.host + "/Services/EncounterServiceProxy.svc/GetEncounterProviderNames";

		$.ajax({
			type: "GET",
			datatype: "json",
			contenttype: "application/json; charset=utf-8",
			url: proNames,
			timeout: 50000,
			async: false,
			success: GlobalEncounterProviderListSuccess,
			error: EncounterProviderListError,
			complete: EncounterProviderListComplete
		});
	};
	function GlobalEncounterProviderListSuccess(data, textStatus, XMLHttpRequest) {
		if (data != null) {
			this.EncounterProviderList = data;
			$.each(this.EncounterProviderCallback, function (index, callback) {
				if (callback.length > 0)
					//callback(this.EncounterProviderList);
					return this.EncounterProviderList;
			}).done(function () {
				this.EncounterProviderList = null;
			});

			//callbackFunction(EncounterProviderList);
		}
	};

	function EncounterProviderListError(data, textStatus, XMLHttpRequest) {
		return true;
	};

	function EncounterProviderListComplete(data, textStatus, XMLHttpRequest) {
		return true;
	};
}(jQuery);

var sleep = function (milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds) {
			break;
		}
	}
}

var StopWatch = function (performance) {
	this.startTime = 0;
	this.stopTime = 0;
	this.running = false;
	this.performance = performance === false ? false : !!window.performance;
};

StopWatch.prototype.currentTime = function () {
	return this.performance ? window.performance.now() : new Date().getTime();
};

StopWatch.prototype.start = function () {
	this.startTime = this.currentTime();
	this.running = true;
};

StopWatch.prototype.stop = function () {
	this.stopTime = this.currentTime();
	this.running = false;
};

StopWatch.prototype.getElapsedMilliseconds = function () {
	if (this.running) {
		this.stopTime = this.currentTime();
	}

	return this.stopTime - this.startTime;
};

StopWatch.prototype.getElapsedSeconds = function () {
	return this.getElapsedMilliseconds() / 1000;
};

StopWatch.prototype.printElapsed = function (name) {
	var currentName = name || 'Elapsed:';

	//var message = currentName + '[' + this.getElapsedMilliseconds() + 'ms] ' + ' [' + this.getElapsedSeconds() + 's]';
	var message = currentName + ' [' + this.getElapsedSeconds() + 's]';
	console.log(message);
	// Is there a div to display these timing messages?
	var $divTime = $('#displayElapsedTime');
	// Add it to that div
	if ($divTime.length > 0)
		$divTime.prepend('<span>' + message + '</span><br/>');
};

/// this is a global module to minimize service calls
// By default, all variables and functions inside are private. Not accessible directly
// More about Module pattern here: http://addyosmani.com/resources/essentialjsdesignpatterns/book/#modulepatternjavascript
var PEMR_GlobalProviderList = (function ($) {

	// data structures to store values for callback functions to GetEncounterProviderNames
	var EncounterProviderList = null;
	var EncounterCallInProgress = 0;
	var EncounterProviderCallback = [];

	// Call PEMR_GetEncounterProviderList to get the provider names from server
	// This function will callback the function "callbackFunction" when the server returns the value
	// On return from the service, the module stores the return value
	// If the service has already returned the provider list, that same provider list will be returned to the call back
	// if the service has not executed before, it will make a new service call
	// this function does not take any arguments at  the moment
	var PEMR_GetEncounterProviderList = function (callbackFunction) {

		//console.log("Inside PEMR_GetEncounterProviderList: " );
		// If we already have this list from the server, return that list
		if (EncounterProviderList != null) {
			// executing the callback function
			callbackFunction(EncounterProviderList);
			return true;
		}
		// The provider list is not yet available, so add the callback function to the waiting list
		EncounterProviderCallback.push(callbackFunction);

		// if the service call is in progress, return right away
		if (EncounterCallInProgress === 1) {
			return true;
		}
		// set the in progress flag
		EncounterCallInProgress = 1;

		var proNames = "/Services/EncounterServiceProxy.svc/GetEncounterProviderNames";

		// make the ajax call
		$.ajax({
			type: "GET",
			dataType: "json",
			//data: {html: "Return from callback", delay: 3},
			contentType: "application/json; charset=utf-8",
			url: proNames,
			timeout: 30000,
			success: EncounterProviderListSuccess,
			error: EncounterProviderListError,
			complete: EncounterProviderListComplete
		});
	};

	// Success callback for the ajax call
	function EncounterProviderListSuccess(data, textStatus, XMLHttpRequest) {
		console.log("inside EncounterProviderListSuccess: " + data + " arr count: " + EncounterProviderCallback.length)

		// verify that service has returned data
		if (data != null) {
			// assign incoming data to EncounterProviderList
			EncounterProviderList = data;
			//if PEMR_GetEncounterProviderList function invoked first then assign provider list  to global variable EncounterProviderListV2 
			if (typeof EncounterProviderListV2 !== 'undefined') {
			EncounterProviderListV2 = data;
			}
			// TODO:
			// if the provider list is always converted into an HTML option, considering doing that here once
			// then storing that HMTL and returning it to every caller

			// iterate through the call back array
			for (var i = 0; i < EncounterProviderCallback.length; i++) {
				//console.log("call func: " + callback);
				// verify the callback is indeed a function
				if (EncounterProviderCallback[i] != undefined && EncounterProviderCallback[i].length > 0 && typeof EncounterProviderCallback[i] == 'function') {
					//console.log("call func: " + EncounterProviderCallback[i]);
					// now call the callback function
					EncounterProviderCallback[i](EncounterProviderList);
				}
			}
		}
		// null the callback list
		EncounterProviderCallback = null;
		// service is not in progress
		EncounterCallInProgress = 0;

	};

	// Error. Not a good thing
	function EncounterProviderListError(data, textStatus, XMLHttpRequest) {
		console.log("Inside PEMR_GetEncounterProviderList, error accessing service: " + data);
		EncounterCallInProgress = 0;
		return true;
	};

	// ajax call is complete. Now reset the variables
	function EncounterProviderListComplete(data, textStatus, XMLHttpRequest) {
		EncounterCallInProgress = 0;
		return true;
	};

	// return the only public function from the module.
	// to access this module, make the following call
	// PEMR_GlobalProviderList.PEMR_GetEncounterProviderList(executeThis);
	return { PEMR_GetEncounterProviderList: PEMR_GetEncounterProviderList };

	// other functions and variables in the module are not public
	// you cannot access PEMR_GlobalProviderList.EncounterProviderList from outside

	/*
	-- following is sample code to execute the module
	//Put the following line anywhere in your code
	PEMR_GlobalProviderList.PEMR_GetEncounterProviderList(executeThis);

	//executeThis is the callback function to execute after the provider list is obtained
	// define this kind of function in your code or reuse existing
	function executeThis(data)
	{
		console.log("inside et " + data.CurrentUserID);
	}
	*/
})(jQuery);


function PEMR_BindAssessmentOrProblemICDV2(options) {
	//Example html for with we want to bind the Assessment ICD Search using this function
	//  <div style="width: 100%; display: block;">
	//      <label class="cssCaption">Type new problem :</label>
	//      <input id="#ICDSearch" type="text" class="ac_input" style="width: 450px; float: left; margin: 10px 0px 0px 5px;" />
	//      <img alt="" src="../img/SmallProgressLogo.gif" class="icdProgress">
	//  <div>


	//Assign Default values to options
	var finalOptions = {
		//The jquery-id-selector of the text box control to which the autocomplete needs to be binded
		//Ex           : '#ICDSearch'
		//Default-Value: THIS PARAMETER IS NOT OPTIONAL
		'jqID_TextBox': PJSON.CEmptyString(options.jqID_TextBox),


		//Text that should be displayed in the text box when autocomplete textbox is empty
		//Ex           : 'Start typing Problem Code (or) Description here..'
		//Default Value: ''
		'placeHolderText': PJSON.CEmptyString(options.placeHolderText),


		//The jquery-selector for the rotating image
		//Ex           : '$("#ICDSearch").siblings("img.icdProgress")'
		//Default-Value: ''
		'jqSelector_Image': PJSON.CEmptyString(options.jqSelector_Image),


		//Format in which the auto-complete list should appear
		//Ex            : 'IT(IC)'
		//Default-Value : '(IC)IT'
		'listFormat': (PJSON.CEmptyString(options.listFormat) == '') ? '(IC)IT' : PJSON.CEmptyString(options.listFormat),


		//Format in which the text should be displayed post-selecting an item
		//Ex            : 'IT(IC)'
		//Default-Value : '(IC)IT'
		'resultFormat': (PJSON.CEmptyString(options.listFormat) == '') ? '(IC)IT' : PJSON.CEmptyString(options.resultFormat),


		//The callback JS-function-name to call post-selecting an item
		//Ex           : ICDSearch_OnItemSelect
		//NOTE         : This function has only one parameters "data"
		//Default-Value: null
		'onSelectCallBackFunctionName': (typeof (options.onSelectCallBackFunctionName) == 'function') ? options.onSelectCallBackFunctionName : null,


		//If true, then, clears the text-box content post-selecting an item
		//and focus remains in the current text box itself
		//Ex           : true
		//Default-Value: true
		'resetValuesPostSelection': (typeof (options.resetValuesPostSelection) == 'boolean') ? options.resetValuesPostSelection : true,


		//If true, upon binding auto-complete to a text-box then, 
		//  clears the text-box content, as well as the data from hidden controls (or) object data is clear
		//Ex           : true
		//Default-Value: true
		'resetValuesOnBind': (typeof (options.resetValuesOnBind) == 'boolean') ? options.resetValuesOnBind : true,


		//If true, upon unbinding auto-complete from a text-box then, 
		//  clears the text-box content, as well as the data from hidden controls (or) object data is clear
		//Ex           : true
		//Default-Value: true
		'resetValuesOnUnbind': (typeof (options.resetValuesOnUnbind) == 'boolean') ? options.resetValuesOnUnbind : true,


		//Provide Javascript expression that can correctly evaluated to a boolean value
		//      i.e If evaluates to true, then, it displays ICD9 codes within circular brackets at end if isICD10ActiveExpression evaluates to true
		//                                else it displays ICD10 codes within circular brackets at end if isICD10ActiveExpression evaluates to false
		//NOTE         : refer to CONFIG_DisplayICD9ICD10Codes flag 
		//Ex           : true
		//Default-Value: false
		'displayICD9ICD10CodesExpression': PJSON.CEmptyString(options.displayICD9ICD10CodesExpression),


		//If true, then ICD10 codes are considered primary and they will be considered, else ICD9 codes
		//NOTE         : refer to CONFIG_ISICD10Active flag 
		//Ex           : true
		//Default-Value: false
		'isICD10ActiveExpression': PJSON.CEmptyString(options.isICD10ActiveExpression),


		//If true , then, the selected item values are stored externally into hidden variables
		//                Note: The hidden variable jquery names can be provided as given below
		//   flase, then,   these values are stored as data in the text-box control
		//Ex           : true
		//Default-Value: true
		'useDataMode': (typeof (options.useDataMode) == 'boolean') ? options.useDataMode : true,


		//Jquery ID's of the hidden variables in which respective values of selected items is stored
		//Ex           : '#Selected_ICDCode'
		//Default-Value: ''
		'jqID_SearchPrefix': PJSON.CEmptyString(options.jqID_SearchPrefix),
		'jqID_IsFrequent': PJSON.CEmptyString(options.jqID_IsFrequent),
		'jqID_ICDCode': PJSON.CEmptyString(options.jqID_ICDCode),
		'jqID_ICDTitle': PJSON.CEmptyString(options.jqID_ICDTitle),
		'jqID_ICD10Code': PJSON.CEmptyString(options.jqID_ICD10Code),
		'jqID_ICD10Title': PJSON.CEmptyString(options.jqID_ICD10Title),
		'jqID_SNOMEDCode': PJSON.CEmptyString(options.jqID_SNOMEDCode),
		'jqID_SNOMEDTitle': PJSON.CEmptyString(options.jqID_SNOMEDTitle),
		'jqID_SourceKey': PJSON.CEmptyString(options.jqID_SourceKey),
		'jqID_SourceType': PJSON.CEmptyString(options.jqID_SourceType)
	};


	return PEMR_BindAssessmentOrProblemICD(
		finalOptions.jqID_TextBox,
		finalOptions.placeHolderText,
		finalOptions.jqSelector_Image,
		finalOptions.listFormat,
		finalOptions.resultFormat,
		finalOptions.onSelectCallBackFunctionName,
		finalOptions.resetValuesPostSelection,
		finalOptions.resetValuesOnBind,
		finalOptions.resetValuesOnUnbind,
		finalOptions.displayICD9ICD10CodesExpression,
		finalOptions.isICD10ActiveExpression,
		finalOptions.useDataMode,
		finalOptions.jqID_SearchPrefix,
		finalOptions.jqID_IsFrequent,
		finalOptions.jqID_ICDCode,
		finalOptions.jqID_ICDTitle,
		finalOptions.jqID_ICD10Code,
		finalOptions.jqID_ICD10Title,
		finalOptions.jqID_SNOMEDCode,
		finalOptions.jqID_SNOMEDTitle,
		finalOptions.jqID_SourceKey,
		finalOptions.jqID_SourceType);
}


//function PEMR_BindAssessmentOrProblemICD(jqID_TextBox, jqSelector_Image,
//	listFormat, resultFormat, useDataMode, resetValuesPostSelection, resetValuesOnBind, resetValuesOnUnbind, placeHolderText, onSelectCallBackFunctionName,
//	jqID_ICDCode, jqID_ICDTitle, jqID_ICD10Code, jqID_ICD10Title, jqID_IsFrequent,
//	jqID_SNOMEDCode, jqID_SNOMEDTitle,
//	jqID_SearchPrefix, jqID_SourceKey, jqID_SourceType)

function PEMR_BindAssessmentOrProblemICD(jqID_TextBox, placeHolderText, jqSelector_Image,
	listFormat, resultFormat, onSelectCallBackFunctionName,
	resetValuesPostSelection, resetValuesOnBind, resetValuesOnUnbind,
	displayICD9ICD10CodesExpression, isICD10ActiveExpression,
	useDataMode, jqID_SearchPrefix, jqID_IsFrequent,
	jqID_ICDCode, jqID_ICDTitle, jqID_ICD10Code, jqID_ICD10Title,
	jqID_SNOMEDCode, jqID_SNOMEDTitle,
	jqID_SourceKey, jqID_SourceType) {

	//NOTE: All ID's should be valid jquery id selectors.
	//      Ex. #autosearch
	//NOTE: For image selector plz provide valid relative jquery selector code with reference to this.
	//      Ex. $(#autosearch).sibilings().find('img')
	//NOTE: Formatter styles
	//      ICDCode(IC),  ICDTitle(IT), ICD10Code(IC),  ICD10Title(IT), //****[Note same format is given for both fields, which fields to display is governed by isICD10Active flag ]****//
	//      IsFrequent(ISF), SNOMEDCode(SDC), SNOMEDTitle(SDT),
	//      SearchPrefix(SRP),  SourceKey(SOK), SourceType(SOT)

	//console.log('PARAMS :: [jqID_TextBox]={' + jqID_TextBox + '},[placeHolderText]={' + placeHolderText + '},[jqSelector_Image]={' + jqSelector_Image + '},[listFormat]={' + listFormat + '},[resultFormat]={' + resultFormat + '},[onSelectCallBackFunctionName]={' + onSelectCallBackFunctionName + '},[resetValuesPostSelection]={' + resetValuesPostSelection + '},[resetValuesOnBind]={' + resetValuesOnBind + '},[resetValuesOnUnbind]={' + resetValuesOnUnbind + '},[displayICD9ICD10Codes]={' + displayICD9ICD10Codes + '},[isICD10Active]={' + isICD10Active + '},[useDataMode]={' + useDataMode + '},[jqID_SearchPrefix]={' + jqID_SearchPrefix + '},[jqID_IsFrequent]={' + jqID_IsFrequent + '},[jqID_ICDCode]={' + jqID_ICDCode + '},[jqID_ICDTitle]={' + jqID_ICDTitle + '},[jqID_ICD10Code]={' + jqID_ICD10Code + '},[jqID_ICD10Title]={' + jqID_ICD10Title + '},[jqID_SNOMEDCode]={' + jqID_SNOMEDCode + '},[jqID_SNOMEDTitle]={' + jqID_SNOMEDTitle + '},[jqID_SourceKey]={' + jqID_SourceKey + '},[jqID_SourceType]={' + jqID_SourceType + '}.');

	//Validate the inputs
	$jqTextBox = $(jqID_TextBox);
	if ($jqTextBox.length <= 0) { return false; }
	if (listFormat != '(IC)IT' && listFormat != 'IC' && listFormat != 'IT') {
		listFormat = '(IC)IT';
	}
	if (resultFormat != '(IC)IT' && resultFormat != 'IC' && resultFormat != 'IT') {
		resultFormat = '(IC)IT';
	}
	var $imgObj = eval(jqSelector_Image);


	//Check if the auto-complete is already binded
	var ac_IsAlreadyBinded = PJSON.CBooltruefalse($jqTextBox.data('ac_IsAlreadyBinded'));
	if (ac_IsAlreadyBinded == true) { return false; }

	//If reset of values requested then clear the contents
	if (resetValuesOnBind == true) {
		$jqTextBox.val('');
		if (useDataMode == true) {
			$(this).removeData();
		}
		else {
			$(jqID_ICDCode).val('');
			$(jqID_ICDTitle).val('');
			$(jqID_ICD10Code).val('');
			$(jqID_ICD10Title).val('');
			$(jqID_IsFrequent).val('');
			$(jqID_SNOMEDCode).val('');
			$(jqID_SNOMEDTitle).val('');
			$(jqID_SearchPrefix).val('');
			$(jqID_SourceKey).val('');
			$(jqID_SourceType).val('');
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	}


	//---[ Bind the auto-complete ]---
	//Form the url
	var vSearchURL = window.location.protocol
		+ '//'
		+ window.location.host
		+ '/Services/AssessmentPlanServiceProxy.svc/SearchAssessment';
	//form the options
	var vSearchOptions = {
		multiple: false,
		width: 410,
		dataType: 'json',
		matchContains: true,
		autoFill: false,
		selectFirst: false,
		AASFlag: true,
		generateData: function (dataItem) {
			var isICD10Active = false;
			try {
				isICD10Active = eval(isICD10ActiveExpression);
			} catch (ex) {
				PEMR_LogInFBC_TryCatchObject('PEMR_BindAssessmentOrProblemICD:isICD10ActiveExpression:generateData: [' + isICD10ActiveExpression + ']:', ex);
			}

			dataItem.ICDCode = PJSON.CEmptyString(dataItem.ICDCode);
			dataItem.ICDTitle = PJSON.CEmptyString(dataItem.ICDTitle);
			dataItem.ICD10Code = PJSON.CEmptyString(dataItem.ICD10Code);
			dataItem.ICD10Title = PJSON.CEmptyString(dataItem.ICD10Title);
			var resultCode = dataItem.ICDCode;
			var result = '';
			switch (resultFormat) {
				case 'IC':
					if (isICD10Active == true)
						result = dataItem.ICD10Code;
					else
						result = dataItem.ICDCode;
					break;
				case 'IT':
					if (isICD10Active == true)
						result = dataItem.ICDTitle;
					else
						result = dataItem.ICDTitle;
					break;
				case '(IC)IT':
					if (isICD10Active == true)
						result = '(' + dataItem.ICD10Code + ') ' + dataItem.ICDTitle;
					else
					result = '(' + dataItem.ICDCode + ') ' + dataItem.ICDTitle;
					break;
					
			}
			var parsedItem = { data: dataItem, result: result, value: resultCode };
			return parsedItem;
		},
		formatItem: function (data, pos, max, val, query) {
			var displayICD9ICD10Codes = false;
			try {
				displayICD9ICD10Codes = eval(displayICD9ICD10CodesExpression);
			} catch (ex) {
				PEMR_LogInFBC_TryCatchObject('PEMR_BindAssessmentOrProblemICD:displayICD9ICD10CodesExpression:formatItem: [' + displayICD9ICD10CodesExpression + ']:', ex);
			}
			var isICD10Active = false;
			try {
				isICD10Active = eval(isICD10ActiveExpression);
			} catch (ex) {
				PEMR_LogInFBC_TryCatchObject('PEMR_BindAssessmentOrProblemICD:isICD10ActiveExpression:formatItem: [' + isICD10ActiveExpression + ']:', ex);
			}


			data.ICDCode = PJSON.CEmptyString(data.ICDCode);
			data.ICDTitle = PJSON.CEmptyString(data.ICDTitle);
			data.ICD10Code = PJSON.CEmptyString(data.ICD10Code);
			data.ICD10Title = PJSON.CEmptyString(data.ICD10Title);
			var formattedText = '';
			switch (listFormat) {
				case 'IC':
					if (isICD10Active == true)
						formattedText = data.ICD10Code;
					else
						formattedText = data.ICDCode;
					break;
				case 'IT':
					if (isICD10Active == true)
						formattedText = data.ICDTitle;
					else
						formattedText = data.ICDTitle;
					break;
				case '(IC)IT':
					if (isICD10Active == true) {
						formattedText = '(' + data.ICD10Code + ') ' + data.ICDTitle;
						if (displayICD9ICD10Codes == true)
							formattedText = formattedText + ' (' + data.ICDCode + ')';
					}
					else {
						formattedText = '(' + data.ICDCode + ') ' + data.ICDTitle;
						if (displayICD9ICD10Codes == true)
							formattedText = formattedText + ' (' + data.ICD10Code + ')';
					}
					//Make sure that search string has prefeix "S:" only in the begning of search param
					formattedText = query.toLowerCase().indexOf('s:') == 0 ? PJSON.IsNullOrEmptyOrUndefinedString(data.SNOMEDCode) == true ? formattedText :formattedText + ' (' + data.SNOMEDCode + ')' :formattedText;
					break;
			}
			return formattedText;
		},
		beforesuggest: function (input) {
			// If user do any operation when loss the Network Connection then displayed Network Connection Loss alert
			if (!PEMR_NetworkConnectionAlert())
				return false;
			$imgObj.css({ 'display': 'inline' });
		},
		aftersuggest: function (input) {
			$imgObj.css({ 'display': 'none' });
		}
	};
	$jqTextBox.autocompleteJQU(vSearchURL, vSearchOptions).resultJQU(function (event, data, formatted) {
		var isICD10Active = false;
		try {
			isICD10Active = eval(isICD10ActiveExpression);
		} catch (ex) {
			PEMR_LogInFBC_TryCatchObject('PEMR_BindAssessmentOrProblemICD:isICD10ActiveExpression:autocompleteJQU: [' + isICD10ActiveExpression + ']:', ex);
		}

		//Set the values in the data object
		if (useDataMode == true) {
			$(this).data('ac_ICDCode', data.ICDCode);
			$(this).data('ac_ICDTitle', data.ICDTitle);
			$(this).data('ac_ICD10Code', data.ICD10Code);
			$(this).data('ac_ICD10Title', data.ICD10Title);
			$(this).data('ac_IsFrequent', data.IsFrequent);
			$(this).data('ac_SNOMEDCode', data.SNOMEDCode);
			$(this).data('ac_SNOMEDTitle', data.SNOMEDTitle);
			$(this).data('ac_SearchPrefix', data.SearchPrefix);
			$(this).data('ac_SourceKey', data.SourceKey);
			$(this).data('ac_SourceType', data.SourceType);
		}
		else {
			if ($(jqID_ICDCode).length == 1) { $(jqID_ICDCode).val(data.ICDCode); }
			if ($(jqID_ICDTitle).length == 1) { $(jqID_ICDTitle).val(data.ICDTitle); }
			if ($(jqID_ICD10Code).length == 1) { $(jqID_ICD10Code).val(data.ICD10Code); }
			if ($(jqID_ICD10Title).length == 1) { $(jqID_ICD10Title).val(data.ICD10Title); }
			if ($(jqID_IsFrequent).length == 1) { $(jqID_IsFrequent).val(data.IsFrequent); }
			if ($(jqID_SNOMEDCode).length == 1) { $(jqID_SNOMEDCode).val(data.SNOMEDCode); }
			if ($(jqID_SNOMEDTitle).length == 1) { $(jqID_SNOMEDTitle).val(data.SNOMEDTitle); }
			if ($(jqID_SearchPrefix).length == 1) { $(jqID_SearchPrefix).val(data.SearchPrefix); }
			if ($(jqID_SourceKey).length == 1) { $(jqID_SourceKey).val(data.SourceKey); }
			if ($(jqID_SourceType).length == 1) { $(jqID_SourceType).val(data.SourceType); }
		}

		//Determine the result to display
		data.ICDCode = PJSON.CEmptyString(data.ICDCode);
		data.ICDTitle = PJSON.CEmptyString(data.ICDTitle);
		data.ICD10Code = PJSON.CEmptyString(data.ICD10Code);
		data.ICD10Title = PJSON.CEmptyString(data.ICD10Title);
		var result = '';
		switch (resultFormat) {
			case 'IC':
				if (isICD10Active == true)
					result = data.ICD10Code;
				else
					result = data.ICDCode;
				break;
			case 'IT':
				if (isICD10Active == true)
					result = data.ICDTitle;
				else
					result = data.ICDTitle;
				break;
			case '(IC)IT':
				if (isICD10Active == true)
					result = '(' + data.ICD10Code + ') ' + data.ICDTitle;
				else
					result = '(' + data.ICDCode + ') ' + data.ICDTitle;
				break;
		}


		//Save the values into the hidden fields
		if (resetValuesPostSelection == true) {
			$(this).val('');
			$(this).focus();
		}
		else {
			$(this).val(result);
		}

		//Trigger the call back function with selected values as parameters
		if (typeof (onSelectCallBackFunctionName) == 'function') {
			onSelectCallBackFunctionName(data);
		}
	});

	//Set the place holder text
	$jqTextBox.attr('placeholder', placeHolderText);


	//Bind the change event because, if text is changed, then hidden values also need to change
	$jqTextBox.bind('blur', function () {
		var isICD10Active = false;
		try {
			isICD10Active = eval(isICD10ActiveExpression);
		} catch (ex) {
			PEMR_LogInFBC_TryCatchObject('PEMR_BindAssessmentOrProblemICD:isICD10ActiveExpression:blur: [' + isICD10ActiveExpression + ']:', ex);
		}

		//Get the hidden values
		var icdCode = '';
		var icdTitle = '';
		var icd10Code = '';
		var icd10Title = '';
		if (useDataMode == true) {
			icdCode = $(this).data('ac_ICDCode');
			icdTitle = $(this).data('ac_ICDTitle');
			icd10Code = $(this).data('ac_ICD10Code');
			icd10Title = $(this).data('ac_ICD10Title');
		}
		else {
			icdCode = $(jqID_ICDCode).val();
			icdTitle = $(jqID_ICDTitle).val();
			icd10Code = $(jqID_ICD10Code).val();
			icd10Title = $(jqID_ICD10Title).val();
		}
		//console.log('jqID_ICDCode[' + jqID_ICDCode + '], jqID_ICDTitle=[' + jqID_ICDTitle + '], jqID_ICD10Code=[' + jqID_ICD10Code + '], jqID_ICD10Title=[' + jqID_ICD10Title + ']');
		//console.log('icdCode[' + icdCode + '], icdTitle=[' + icdTitle + '], icd10Code=[' + icd10Code + '], icd10Title=[' + icd10Title + ']');


		//Form the expected text box value using hidden values
		icdCode = PJSON.CEmptyString(icdCode);
		icdTitle = PJSON.CEmptyString(icdTitle);
		icd10Code = PJSON.CEmptyString(icd10Code);
		icd10Title = PJSON.CEmptyString(icd10Title);
		
		//console.log('resultFormat[' + resultFormat + ']');
		var result = '';
		switch (resultFormat) {
			case 'IC':
				if (isICD10Active == true)
					result = icd10Code;
				else
					result = icdCode;
				break;
			case 'IT':
				if (isICD10Active == true)
					result = icdTitle;
				else
					result = icdTitle;
				break;
			case '(IC)IT':
				if (isICD10Active == true)
					result = '(' + icd10Code + ') ' + icdTitle;
				else
				    result = '(' + icdCode + ') ' + icdTitle;
				break;
        }

		//Compare expected and actual values, if mis-matched, then reset the hidden value contents
		//console.log('result[' + result + ']=$(this).val[' + $(this).val() + ']');
		if (result != $(this).val()) {
			$(this).val('');
			if (useDataMode == true) {
				$(this).data('ac_ICDCode', '');
				$(this).data('ac_ICDTitle', '');
				$(this).data('ac_ICD10Code', '');
				$(this).data('ac_ICD10Title', '');
				$(this).data('ac_IsFrequent', '');
				$(this).data('ac_SNOMEDCode', '');
				$(this).data('ac_SNOMEDTitle', '');
				$(this).data('ac_SearchPrefix', '');
				$(this).data('ac_SourceKey', '');
				$(this).data('ac_SourceType', '');
			}
			else {
				if ($(jqID_ICDCode).length == 1) { $(jqID_ICDCode).val(''); }
				if ($(jqID_ICDTitle).length == 1) { $(jqID_ICDTitle).val(''); }
				if ($(jqID_ICD10Code).length == 1) { $(jqID_ICD10Code).val(''); }
				if ($(jqID_ICD10Title).length == 1) { $(jqID_ICD10Title).val(''); }
				if ($(jqID_IsFrequent).length == 1) { $(jqID_IsFrequent).val(''); }
				if ($(jqID_SNOMEDCode).length == 1) { $(jqID_SNOMEDCode).val(''); }
				if ($(jqID_SNOMEDTitle).length == 1) { $(jqID_SNOMEDTitle).val(''); }
				if ($(jqID_SearchPrefix).length == 1) { $(jqID_SearchPrefix).val(''); }
				if ($(jqID_SourceKey).length == 1) { $(jqID_SourceKey).val(''); }
				if ($(jqID_SourceType).length == 1) { $(jqID_SourceType).val(''); }
			}
		}
	});


	$jqTextBox.bind('UnbindAutoComplete', function () {
		//Unbind the auto-complete
		$jqTextBox.unautocompleteJQU();

		//Unbind custom Events
		$jqTextBox.unbind('blur');

		//Clear the attributes
		if (resetValuesOnUnbind == true) {
			$jqTextBox.val('');
			$jqTextBox.attr('placeholder', '');
			if (useDataMode == true) {
				$(this).removeData();
			}
			else {
				$(jqID_ICDCode).val('');
				$(jqID_ICDTitle).val('');
				$(jqID_ICD10Code).val('');
				$(jqID_ICD10Title).val('');
				$(jqID_IsFrequent).val('');
				$(jqID_SNOMEDCode).val('');
				$(jqID_SNOMEDTitle).val('');
				$(jqID_SearchPrefix).val('');
				$(jqID_SourceKey).val('');
				$(jqID_SourceType).val('');
			}
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	});


	//Mark the auto-complete for binding
	$jqTextBox.data('ac_IsAlreadyBinded', true);
}

function PEMR_BindVaccinationOrImmunizationCPT(jqID_TextBox, jqSelector_Image,
	listFormat, resultFormat, useDataMode, resetValuesPostSelection, resetValuesOnBind, resetValuesOnUnbind, placeHolderText, onSelectCallBackFunctionName,
	jqID_CPTCode, jqID_CPTDesc,
	jqID_CVXCode, jqID_CVXVaccineLongName, jqID_CVXVaccineName, IsSearchByCPT) {

	//NOTE: All ID's should be valid jquery id selectors.
	//      Ex. #autosearch
	//NOTE: For image selector plz provide valid relative jquery selector code with reference to this.
	//      Ex. $(#autosearch).sibilings().find('img')
	//NOTE: Formatter styles
	//      CPTCode(CPC), CPTDesc(CPD), CVXCode(CVC), CVXVaccineLongName(CVLN), CVXVaccineName(CVN),


	//Validate the inputs
	$jqTextBox = $(jqID_TextBox);
	if ($jqTextBox.length <= 0) { return false; }
	if (listFormat != '(CPC)CVN' && listFormat != '(CVC)CVN' && listFormat != '(CPC)CPD' && listFormat != 'CVN' && listFormat != 'CPC' && listFormat != 'CPD') {
		listFormat = '(CPC)CPD';
	}
	if (resultFormat != '(CPC)CVN' && listFormat != '(CVC)CVN' && resultFormat != '(CPC)CPD' && resultFormat != 'CVN' && resultFormat != 'CPC' && resultFormat != 'CPD') {
		resultFormat = '(CPC)CPD';
	}
	var $imgObj = eval(jqSelector_Image);

	//Check if the auto-complete is already binded
	var ac_IsAlreadyBinded = PJSON.CBooltruefalse($jqTextBox.data('ac_IsAlreadyBinded'));
	if (ac_IsAlreadyBinded == true) { return false; }

	//If reset of values requested then clear the contents
	if (resetValuesOnBind == true) {
		$jqTextBox.val('');
		if (useDataMode == true) {
			$(this).removeData();
		}
		else {
			$(jqID_CPTCode).val('');
			$(jqID_CPTDesc).val('');
			$(jqID_CVXCode).val('');
			$(jqID_CVXVaccineLongName).val('');
			$(jqID_CVXVaccineName).val('');
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	}

	//---[ Bind the auto-complete ]---
	//Form the url
	var vSearchURL = window.location.protocol
		+ '//'
		+ window.location.host
		+ '/Services/ImmunizationServiceProxy.svc/GetAllVaccinesSuggestList?IsSearchByCPT=' + IsSearchByCPT;
	//form the options
	var vSearchOptions = {
		multiple: false,
		width: 410,
		dataType: 'json',
		matchContains: true,
		autoFill: false,
		selectFirst: false,
		AASFlag: true,
		generateData: function (dataItem) {
			dataItem.CPTCode = PJSON.CEmptyString(dataItem.CPTCode);
			dataItem.CPTDesc = PJSON.CEmptyString(dataItem.CPTDesc);
			dataItem.CVXVaccineName = PJSON.CEmptyString(dataItem.CVXVaccineName);
			var resultCode = dataItem.CPTCode;
			var result = '';
			switch (resultFormat) {
				case 'CPC':
					result = dataItem.CPTCode;
					break;
				case 'CPD':
					result = dataItem.CPTDesc;
					break;
				case 'CVN':
					result = dataItem.CVXVaccineName;
					break;
				case '(CPC)CPD':
					result = '(' + dataItem.CPTCode + ') ' + dataItem.CPTDesc;
					break;
				case '(CPC)CVN':
					result = '(' + dataItem.CPTCode + ') ' + dataItem.CVXVaccineName;
					break;
				case '(CVC)CVN':
					result = '(' + dataItem.CVXCode + ') ' + dataItem.CVXVaccineName;
					break;
			}
			var parsedItem = { data: dataItem, result: result, value: resultCode };
			return parsedItem;
		},
		formatItem: function (data, pos, max, val, query) {
			var formattedText = '';
			data.CPTCode = PJSON.CEmptyString(data.CPTCode);
			data.CPTDesc = PJSON.CEmptyString(data.CPTDesc);
			data.CVXVaccineName = PJSON.CEmptyString(data.CVXVaccineName);
			switch (listFormat) {
				case 'CPC':
					formattedText = data.CPTCode;
					break;
				case 'CPD':
					formattedText = data.CPTDesc;
					break;
				case 'CVN':
					formattedText = data.CVXVaccineName;
					break;
				case '(CPC)CPD':
					formattedText = '(' + data.CPTCode + ') ' + data.CPTDesc;
					break;
				case '(CPC)CVN':
					formattedText = '(' + data.CPTCode + ') ' + data.CVXVaccineName;
					break;
				case '(CVC)CVN':
					formattedText = '(' + data.CVXCode + ') ' + data.CVXVaccineName;
					break;
			}
			return formattedText;
		},
		beforesuggest: function (input) {
			$imgObj.css({ 'display': 'inline' });
		},
		aftersuggest: function (input) {
			$imgObj.css({ 'display': 'none' });
		}
	};
	$jqTextBox.autocompleteJQU(vSearchURL, vSearchOptions).resultJQU(function (event, data, formatted) {
		//Set the values in the data object
		if (useDataMode == true) {
			$(this).data('ac_CPTCode', data.CPTCode);
			$(this).data('ac_CPTDesc', data.CPTDesc);
			$(this).data('ac_CVXCode', data.CVXCode);
			$(this).data('ac_CVXVaccineLongName', data.CVXVaccineLongName);
			$(this).data('ac_CVXVaccineName', data.CVXVaccineName);
		}
		else {
			if ($(jqID_CPTCode).length == 1) { $(jqID_CPTCode).val(data.CPTCode); }
			if ($(jqID_CPTDesc).length == 1) { $(jqID_CPTDesc).val(data.CPTDesc); }
			if ($(jqID_CVXCode).length == 1) { $(jqID_CVXCode).val(data.CVXCode); }
			if ($(jqID_CVXVaccineLongName).length == 1) { $(jqID_CVXVaccineLongName).val(data.CVXVaccineLongName); }
			if ($(jqID_CVXVaccineName).length == 1) { $(jqID_CVXVaccineName).val(data.CVXVaccineName); }
		}


		//Determine the result to display
		data.CPTCode = PJSON.CEmptyString(data.CPTCode);
		data.CPTDesc = PJSON.CEmptyString(data.CPTDesc);
		data.CVXVaccineName = PJSON.CEmptyString(data.CVXVaccineName);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = data.CPTCode;
				break;
			case 'CPD':
				result = data.CPTDesc;
				break;
			case 'CVN':
				result = data.CVXVaccineName;
				break;
			case '(CPC)CPD':
				result = '(' + data.CPTCode + ') ' + data.CPTDesc;
				break;
			case '(CPC)CVN':
				result = '(' + data.CPTCode + ') ' + data.CVXVaccineName;
				break;
			case '(CVC)CVN':
				result = '(' + data.CVXCode + ') ' + data.CVXVaccineName;
				break;
		}


		//Save the values into the hidden fields
		if (resetValuesPostSelection == true) {
			$(this).val('');
			$(this).focus();
		}
		else {
			$(this).val(result);
		}

		//Trigger the call back function with selected values as parameters
		if (typeof (onSelectCallBackFunctionName) == 'function') {
			onSelectCallBackFunctionName(data);
		}
	});

	//Set the place holder text
	$jqTextBox.attr('placeholder', placeHolderText);


	//Bind the change event because, if text is changed, then hidden values also need to change
	$jqTextBox.bind('blur', function () {
		//Get the hidden values
		var cptCode = '';
		var cptDesc = '';
		var cvxCode = '';
		var cvxVaccineName = '';
		if (useDataMode == true) {
			cptCode = $(this).data('ac_CPTCode');
			cptDesc = $(this).data('ac_CPTDesc');
			cvxCode = $(this).data('ac_CVXCode');
			cvxVaccineName = $(this).data('ac_CVXVaccineName');
		}
		else {
			cptCode = $(jqID_CPTCode).val();
			cptDesc = $(jqID_CPTDesc).val();
			cvxCode = $(jqID_CVXCode).val();
			cvxVaccineName = $(jqID_CVXVaccineName).val();
		}

		//Form the expected text box value using hidden values
		cptCode = PJSON.CEmptyString(cptCode);
		cptDesc = PJSON.CEmptyString(cptDesc);
		cvxCode = PJSON.CEmptyString(cvxCode);
		cvxVaccineName = PJSON.CEmptyString(cvxVaccineName);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = cptCode;
				break;
			case 'CPD':
				result = cptDesc;
				break;
			case 'CVN':
				result = cvxVaccineName;
				break;
			case '(CPC)CPD':
				result = '(' + cptCode + ') ' + cptDesc;
				break;
			case '(CPC)CVN':
				result = '(' + cptCode + ') ' + cvxVaccineName;
				break;
			case '(CVC)CVN':
				result = '(' + cvxCode + ') ' + cvxVaccineName;
				break;
		}

		//Compare expected and actual values, if mis-matched, then reset the hidden value contents
		if (result != $(this).val()) {
			$(this).val('');
			if (useDataMode == true) {
				$(this).data('ac_CPTCode', '');
				$(this).data('ac_CPTDesc', '');
				$(this).data('ac_CVXCode', '');
				$(this).data('ac_CVXVaccineLongName', '');
				$(this).data('ac_CVXVaccineName', '');
			}
			else {
				if ($(jqID_CPTCode).length == 1) { $(jqID_CPTCode).val(''); }
				if ($(jqID_CPTDesc).length == 1) { $(jqID_CPTDesc).val(''); }
				if ($(jqID_CVXCode).length == 1) { $(jqID_CVXCode).val(''); }
				if ($(jqID_CVXVaccineLongName).length == 1) { $(jqID_CVXVaccineLongName).val(''); }
				if ($(jqID_CVXVaccineName).length == 1) { $(jqID_CVXVaccineName).val(''); }
			}
		}
	});


	$jqTextBox.bind('UnbindAutoComplete', function () {
		//Unbind the auto-complete
		$jqTextBox.unautocompleteJQU();

		//Unbind custom Events
		$jqTextBox.unbind('blur');

		//Clear the attributes
		if (resetValuesOnUnbind == true) {
			$jqTextBox.val('');
			$jqTextBox.attr('placeholder', '');
			if (useDataMode == true) {
				$(this).removeData();
			}
			else {
				$(jqID_CPTCode).val('');
				$(jqID_CPTDesc).val('');
				$(jqID_CVXCode).val('');
				$(jqID_CVXVaccineLongName).val('');
				$(jqID_CVXVaccineName).val('');
			}
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	});

	//Mark the auto-complete for binding
	$jqTextBox.data('ac_IsAlreadyBinded', true);
}

function PEMR_BindPlanOrRadiologyOrImagingOrProceduresCPT(jqID_TextBox, jqSelector_Image,
	listFormat, resultFormat, useDataMode, resetValuesPostSelection, resetValuesOnBind, resetValuesOnUnbind, placeHolderText, onSelectCallBackFunctionName,
	jqID_CPTCode, jqID_ICDTitle, jqID_IsFrequent,
	jqID_SNOMEDCode, jqID_SNOMEDDesc, jqID_SourceKey, jqID_SourceType, ignoreBlank) {

    ignoreBlank= typeof ignoreBlank !== 'undefined' ? ignoreBlank : 0;

	//NOTE: All ID's should be valid jquery id selectors.
	//      Ex. #autosearch
	//NOTE: For image selector plz provide valid relative jquery selector code with reference to this.
	//      Ex. $(#autosearch).sibilings().find('img')
	//NOTE: Formatter styles
	//      CPTCode(CPC), ICDTitle(IT), IsFrequent(ISF),
	//      SNOMEDCode(SDC), SNOMEDTitle(SDT), SourceKey(SOK), SourceType(SOT)


	//Validate the inputs
	$jqTextBox = $(jqID_TextBox);
	if ($jqTextBox.length <= 0) { return false; }
	if (listFormat != '(CPC)IT' && listFormat != 'IT' && listFormat != 'CPC') {
		listFormat = '(CPC)IT';
	}
	if (resultFormat != '(CPC)IT' && resultFormat != 'CPC' && resultFormat != 'IT') {
		resultFormat = '(CPC)IT';
	}
	var $imgObj = eval(jqSelector_Image);

	//Check if the auto-complete is already binded
	var ac_IsAlreadyBinded = PJSON.CBooltruefalse($jqTextBox.data('ac_IsAlreadyBinded'));
	if (ac_IsAlreadyBinded == true) { return false; }


	//If reset of values requested then clear the contents
	if (resetValuesOnBind == true) {
		$jqTextBox.val('');
		if (useDataMode == true) {
			$(this).removeData();
		}
		else {
			$(jqID_CPTCode).val('');
			$(jqID_ICDTitle).val('');
			$(jqID_IsFrequent).val('');
			$(jqID_SNOMEDCode).val('');
			$(jqID_SNOMEDDesc).val('');
			$(jqID_SourceKey).val('');
			$(jqID_SourceType).val('');
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	}


	//---[ Bind the auto-complete ]---
	//Form the url
	var vSearchURL = window.location.protocol + '//' + window.location.host;
	if (ignoreBlank == 0) {
	    vSearchURL = vSearchURL + '/Services/AssessmentPlanServiceProxy.svc/SearchPlan';
	}
	else if (ignoreBlank == 1) {
	    vSearchURL = vSearchURL + '/Services/AssessmentPlanServiceProxy.svc/SearchCPTCode';
	}
	//form the options
	var vSearchOptions = {
		multiple: false,
		width: 410,
		dataType: 'json',
		matchContains: true,
		autoFill: false,
		selectFirst: false,
		AASFlag: true,
		cacheLength: 0,// flush Auto Complete Text box cached data
		generateData: function (dataItem) {
			dataItem.CPTCode = PJSON.CEmptyString(dataItem.CPTCode);
			dataItem.ICDTitle = PJSON.CEmptyString(dataItem.ICDTitle);
			var resultCode = dataItem.CPTCode;
			var result = '';
			switch (resultFormat) {
				case 'CPC':
					result = dataItem.CPTCode;
					break;
				case 'IT':
					result = dataItem.ICDTitle;
					break;
				case '(CPC)IT':
					result = '(' + dataItem.CPTCode + ') ' + dataItem.ICDTitle;
					break;
			}
			var parsedItem = { data: dataItem, result: result, value: resultCode };
			return parsedItem;
		},
		formatItem: function (data, pos, max, val, query) {
			data.CPTCode = PJSON.CEmptyString(data.CPTCode);
			data.ICDTitle = PJSON.CEmptyString(data.ICDTitle);
			var formattedText = '';
			switch (listFormat) {
				case 'CPC':
					formattedText = data.CPTCode;
					break;
				case 'IT':
					formattedText = data.ICDTitle;
					break;
				case '(CPC)IT':
					formattedText = '(' + data.CPTCode + ') ' + data.ICDTitle;
					break;
			}
			return formattedText;
		},
		beforesuggest: function (input) {
			$imgObj.css({ 'display': 'inline' });
		},
		aftersuggest: function (input) {
			$imgObj.css({ 'display': 'none' });
		}
	};
	$jqTextBox.autocompleteJQU(vSearchURL, vSearchOptions).resultJQU(function (event, data, formatted) {
		//Set the values in the data object
		if (useDataMode == true) {
			$(this).data('ac_CPTCode', data.CPTCode);
			$(this).data('ac_ICDTitle', data.ICDTitle);
			$(this).data('ac_IsFrequent', data.IsFrequent);
			$(this).data('ac_SNOMEDCode', data.SNOMEDCode);
			$(this).data('ac_SNOMEDDesc', data.SNOMEDDesc);
			$(this).data('ac_SourceKey', data.SourceKey);
			$(this).data('ac_SourceType', data.SourceType);
		}
		else {
			if ($(jqID_CPTCode).length == 1) { $(jqID_CPTCode).val(data.CPTCode); }
			if ($(jqID_ICDTitle).length == 1) { $(jqID_ICDTitle).val(data.ICDTitle); }
			if ($(jqID_IsFrequent).length == 1) { $(jqID_IsFrequent).val(data.IsFrequent); }
			if ($(jqID_SNOMEDCode).length == 1) { $(jqID_SNOMEDCode).val(data.SNOMEDCode); }
			if ($(jqID_SNOMEDDesc).length == 1) { $(jqID_SNOMEDDesc).val(data.SNOMEDDesc); }
			if ($(jqID_SourceKey).length == 1) { $(jqID_SourceKey).val(data.SourceKey); }
			if ($(jqID_SourceType).length == 1) { $(jqID_SourceType).val(data.SourceType); }
		}


		//Determine the result to display
		data.CPTCode = PJSON.CEmptyString(data.CPTCode);
		data.ICDTitle = PJSON.CEmptyString(data.ICDTitle);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = data.CPTCode;
				break;
			case 'IT':
				result = data.ICDTitle;
				break;
			case '(CPC)IT':
				result = '(' + data.CPTCode + ') ' + data.ICDTitle;
				break;
		}


		//Save the values into the hidden fields
		if (resetValuesPostSelection == true) {
			$(this).val('');
			$(this).focus();
		}
		else {
			$(this).val(result);
		}


		//Trigger the call back function with selected values as parameters
		if (typeof (onSelectCallBackFunctionName) == 'function') {
			onSelectCallBackFunctionName(data);
		}
	});

	//Set the place holder text
	$jqTextBox.attr('placeholder', placeHolderText);

	//Bind the change event because, if text is changed, then hidden values also need to change
	$jqTextBox.bind('blur', function () {
		//Get the hidden values
		var cptCode = '';
		var icdTitle = '';
		if (useDataMode == true) {
			cptCode = $(this).data('ac_CPTCode');
			icdTitle = $(this).data('ac_ICDTitle');
		}
		else {
			cptCode = $(jqID_CPTCode).val();
			icdTitle = $(jqID_ICDTitle).val();
		}

		//Form the expected text box value using hidden values
		cptCode = PJSON.CEmptyString(cptCode);
		icdTitle = PJSON.CEmptyString(icdTitle);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = cptCode;
				break;
			case 'IT':
				result = icdTitle;
				break;
			case '(CPC)IT':
				result = '(' + cptCode + ') ' + icdTitle;
				break;
		}


		//Compare expected and actual values, if mis-matched, then reset the hidden value contents
		if (result != $(this).val()) {
			$(this).val('');
			if (useDataMode == true) {
				$(this).data('ac_CPTCode', '');
				$(this).data('ac_ICDTitle', '');
				$(this).data('ac_IsFrequent', '');
				$(this).data('ac_SNOMEDCode', '');
				$(this).data('ac_SNOMEDDesc', '');
				$(this).data('ac_SourceKey', '');
				$(this).data('ac_SourceType', '');
			}
			else {
				$(jqID_CPTCode).val('');
				$(jqID_ICDTitle).val('');
				$(jqID_IsFrequent).val('');
				$(jqID_SNOMEDCode).val('');
				$(jqID_SNOMEDDesc).val('');
				$(jqID_SourceKey).val('');
				$(jqID_SourceType).val('');
			}
		}
	});

	$jqTextBox.bind('UnbindAutoComplete', function () {
		//Unbind the auto-complete
		$jqTextBox.unautocompleteJQU();

		//Unbind custom Events
		$jqTextBox.unbind('blur');

		//Clear the attributes
		if (resetValuesOnUnbind == true) {
			$jqTextBox.val('');
			$jqTextBox.attr('placeholder', '');
			if (useDataMode == true) {
				$(this).removeData();
			}
			else {
				$(jqID_CPTCode).val('');
				$(jqID_ICDTitle).val('');
				$(jqID_IsFrequent).val('');
				$(jqID_SNOMEDCode).val('');
				$(jqID_SNOMEDDesc).val('');
				$(jqID_SourceKey).val('');
				$(jqID_SourceType).val('');
			}
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	});

	//Mark the auto-complete for binding
	$jqTextBox.data('ac_IsAlreadyBinded', true);
}

//Creating new CPT Plan search function for use in support page
//because we don't need to validate practiceid in some scenario.
function PEMR_BindPlanOrRadiologyOrImagingOrProceduresCPTSupport(jqID_TextBox, jqSelector_Image,
	listFormat, resultFormat, useDataMode, resetValuesPostSelection, resetValuesOnBind, resetValuesOnUnbind, placeHolderText, onSelectCallBackFunctionName,
	jqID_CPTCode, jqID_ICDTitle, jqID_IsFrequent,
	jqID_SNOMEDCode, jqID_SNOMEDDesc, jqID_SourceKey, jqID_SourceType) {


	//NOTE: All ID's should be valid jquery id selectors.
	//      Ex. #autosearch
	//NOTE: For image selector plz provide valid relative jquery selector code with reference to this.
	//      Ex. $(#autosearch).sibilings().find('img')
	//NOTE: Formatter styles
	//      CPTCode(CPC), ICDTitle(IT), IsFrequent(ISF),
	//      SNOMEDCode(SDC), SNOMEDTitle(SDT), SourceKey(SOK), SourceType(SOT)


	//Validate the inputs
	$jqTextBox = $(jqID_TextBox);
	if ($jqTextBox.length <= 0) { return false; }
	if (listFormat != '(CPC)IT' && listFormat != 'IT' && listFormat != 'CPC') {
		listFormat = '(CPC)IT';
	}
	if (resultFormat != '(CPC)IT' && resultFormat != 'CPC' && resultFormat != 'IT') {
		resultFormat = '(CPC)IT';
	}
	var $imgObj = eval(jqSelector_Image);

	//Check if the auto-complete is already binded
	var ac_IsAlreadyBinded = PJSON.CBooltruefalse($jqTextBox.data('ac_IsAlreadyBinded'));
	if (ac_IsAlreadyBinded == true) { return false; }


	//If reset of values requested then clear the contents
	if (resetValuesOnBind == true) {
		$jqTextBox.val('');
		if (useDataMode == true) {
			$(this).removeData();
		}
		else {
			$(jqID_CPTCode).val('');
			$(jqID_ICDTitle).val('');
			$(jqID_IsFrequent).val('');
			$(jqID_SNOMEDCode).val('');
			$(jqID_SNOMEDDesc).val('');
			$(jqID_SourceKey).val('');
			$(jqID_SourceType).val('');
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	}


	//---[ Bind the auto-complete ]---
	//Form the url
	var vSearchURL = window.location.protocol
		+ '//'
		+ window.location.host
		+ '/Services/AssessmentPlanServiceProxy.svc/SearchPlanSupport';;
	//form the options
	var vSearchOptions = {
		multiple: false,
		width: 410,
		dataType: 'json',
		matchContains: true,
		autoFill: false,
		selectFirst: false,
		AASFlag: true,
		generateData: function (dataItem) {
			dataItem.CPTCode = PJSON.CEmptyString(dataItem.CPTCode);
			dataItem.ICDTitle = PJSON.CEmptyString(dataItem.ICDTitle);
			var resultCode = dataItem.CPTCode;
			var result = '';
			switch (resultFormat) {
				case 'CPC':
					result = dataItem.CPTCode;
					break;
				case 'IT':
					result = dataItem.ICDTitle;
					break;
				case '(CPC)IT':
					result = '(' + dataItem.CPTCode + ') ' + dataItem.ICDTitle;
					break;
			}
			var parsedItem = { data: dataItem, result: result, value: resultCode };
			return parsedItem;
		},
		formatItem: function (data, pos, max, val, query) {
			data.CPTCode = PJSON.CEmptyString(data.CPTCode);
			data.ICDTitle = PJSON.CEmptyString(data.ICDTitle);
			var formattedText = '';
			switch (listFormat) {
				case 'CPC':
					formattedText = data.CPTCode;
					break;
				case 'IT':
					formattedText = data.ICDTitle;
					break;
				case '(CPC)IT':
					formattedText = '(' + data.CPTCode + ') ' + data.ICDTitle;
					break;
			}
			return formattedText;
		},
		beforesuggest: function (input) {
			$imgObj.css({ 'display': 'inline' });
		},
		aftersuggest: function (input) {
			$imgObj.css({ 'display': 'none' });
		}
	};
	$jqTextBox.autocompleteJQU(vSearchURL, vSearchOptions).resultJQU(function (event, data, formatted) {
		//Set the values in the data object
		if (useDataMode == true) {
			$(this).data('ac_CPTCode', data.CPTCode);
			$(this).data('ac_ICDTitle', data.ICDTitle);
			$(this).data('ac_IsFrequent', data.IsFrequent);
			$(this).data('ac_SNOMEDCode', data.SNOMEDCode);
			$(this).data('ac_SNOMEDDesc', data.SNOMEDDesc);
			$(this).data('ac_SourceKey', data.SourceKey);
			$(this).data('ac_SourceType', data.SourceType);
		}
		else {
			if ($(jqID_CPTCode).length == 1) { $(jqID_CPTCode).val(data.CPTCode); }
			if ($(jqID_ICDTitle).length == 1) { $(jqID_ICDTitle).val(data.ICDTitle); }
			if ($(jqID_IsFrequent).length == 1) { $(jqID_IsFrequent).val(data.IsFrequent); }
			if ($(jqID_SNOMEDCode).length == 1) { $(jqID_SNOMEDCode).val(data.SNOMEDCode); }
			if ($(jqID_SNOMEDDesc).length == 1) { $(jqID_SNOMEDDesc).val(data.SNOMEDDesc); }
			if ($(jqID_SourceKey).length == 1) { $(jqID_SourceKey).val(data.SourceKey); }
			if ($(jqID_SourceType).length == 1) { $(jqID_SourceType).val(data.SourceType); }
		}


		//Determine the result to display
		data.CPTCode = PJSON.CEmptyString(data.CPTCode);
		data.ICDTitle = PJSON.CEmptyString(data.ICDTitle);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = data.CPTCode;
				break;
			case 'IT':
				result = data.ICDTitle;
				break;
			case '(CPC)IT':
				result = '(' + data.CPTCode + ') ' + data.ICDTitle;
				break;
		}


		//Save the values into the hidden fields
		if (resetValuesPostSelection == true) {
			$(this).val('');
			$(this).focus();
		}
		else {
			$(this).val(result);
		}


		//Trigger the call back function with selected values as parameters
		if (typeof (onSelectCallBackFunctionName) == 'function') {
			onSelectCallBackFunctionName(data);
		}
	});

	//Set the place holder text
	$jqTextBox.attr('placeholder', placeHolderText);

	//Bind the change event because, if text is changed, then hidden values also need to change
	$jqTextBox.bind('blur', function () {
		//Get the hidden values
		var cptCode = '';
		var icdTitle = '';
		if (useDataMode == true) {
			cptCode = $(this).data('ac_CPTCode');
			icdTitle = $(this).data('ac_ICDTitle');
		}
		else {
			cptCode = $(jqID_CPTCode).val();
			icdTitle = $(jqID_ICDTitle).val();
		}

		//Form the expected text box value using hidden values
		cptCode = PJSON.CEmptyString(cptCode);
		icdTitle = PJSON.CEmptyString(icdTitle);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = cptCode;
				break;
			case 'IT':
				result = icdTitle;
				break;
			case '(CPC)IT':
				result = '(' + cptCode + ') ' + icdTitle;
				break;
		}


		//Compare expected and actual values, if mis-matched, then reset the hidden value contents
		if (result != $(this).val()) {
			//$(this).val('');
			if (useDataMode == true) {
				$(this).data('ac_CPTCode', '');
				$(this).data('ac_ICDTitle', '');
				$(this).data('ac_IsFrequent', '');
				$(this).data('ac_SNOMEDCode', '');
				$(this).data('ac_SNOMEDDesc', '');
				$(this).data('ac_SourceKey', '');
				$(this).data('ac_SourceType', '');
			}
			else {
				$(jqID_CPTCode).val('');
				$(jqID_ICDTitle).val('');
				$(jqID_IsFrequent).val('');
				$(jqID_SNOMEDCode).val('');
				$(jqID_SNOMEDDesc).val('');
				$(jqID_SourceKey).val('');
				$(jqID_SourceType).val('');
			}
		}
	});

	$jqTextBox.bind('UnbindAutoComplete', function () {
		//Unbind the auto-complete
		$jqTextBox.unautocompleteJQU();

		//Unbind custom Events
		$jqTextBox.unbind('blur');

		//Clear the attributes
		if (resetValuesOnUnbind == true) {
			$jqTextBox.val('');
			$jqTextBox.attr('placeholder', '');
			if (useDataMode == true) {
				$(this).removeData();
			}
			else {
				$(jqID_CPTCode).val('');
				$(jqID_ICDTitle).val('');
				$(jqID_IsFrequent).val('');
				$(jqID_SNOMEDCode).val('');
				$(jqID_SNOMEDDesc).val('');
				$(jqID_SourceKey).val('');
				$(jqID_SourceType).val('');
			}
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	});

	//Mark the auto-complete for binding
	$jqTextBox.data('ac_IsAlreadyBinded', true);
}
//end

function PEMR_BindExternalLabTest(jqID_TextBox, labID, jqSelector_Image,
	listFormat, resultFormat, useDataMode, resetValuesPostSelection, resetValuesOnBind, resetValuesOnUnbind, placeHolderText, onSelectCallBackFunctionName,
	jqID_LabID, jqID_LabTestID, jqID_TestCode, jqID_TestName,
	jqID_CPTCode, jqID_LOINCCode) {

	//NOTE: All ID's should be valid jquery id selectors.
	//      Ex. #autosearch
	//NOTE: For image selector plz provide valid relative jquery selector code with reference to this.
	//      Ex. $(#autosearch).sibilings().find('img')
	//NOTE: Formatter styles
	//      LabID(LID), LabTestID(LTID), TestCode(TC), TestName(TN),
	//      CPTCode(CPC), LOINCCode(LOC)


	//Validate the inputs
	$jqTextBox = $(jqID_TextBox);
	if ($jqTextBox.length <= 0) { return false; }
	if (listFormat != '(CPC)TN' && listFormat != 'CPC' && listFormat != 'TN' && listFormat != '(CPC)TN(TC)') {
		listFormat = '(CPC)TN';
	}
	if (resultFormat != '(CPC)TN' && resultFormat != 'CPC' && resultFormat != 'TN' && resultFormat != '(CPC)TN(TC)') {
		resultFormat = '(CPC)TN';
	}
	var $imgObj = eval(jqSelector_Image);

	//Check if the auto-complete is already binded
	var ac_IsAlreadyBinded = PJSON.CBooltruefalse($jqTextBox.data('ac_IsAlreadyBinded'));
	if (ac_IsAlreadyBinded == true) { return false; }

	//If reset of values requested then clear the contents
	if (resetValuesOnBind == true) {
		$jqTextBox.val('');
		if (useDataMode == true) {
			$(this).removeData();
		}
		else {
			$(jqID_LabID).val('');
			$(jqID_LabTestID).val('');
			$(jqID_TestCode).val('');
			$(jqID_TestName).val('');
			$(jqID_CPTCode).val('');
			$(jqID_LOINCCode).val('');
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	}

	//---[ Bind the auto-complete ]---
	//Form the url
	var vSearchURL = window.location.protocol
		+ '//'
		+ window.location.host
		+ '/Services/LabResultsServiceProxy.svc/SearchExternalLabTests?labID=' + labID;
	//form the options
	var vSearchOptions = {
		multiple: false,
		width: 410,
		dataType: 'json',
		matchContains: true,
		autoFill: false,
		selectFirst: false,
		AASFlag: true,
		generateData: function (dataItem) {
			dataItem.LabID = PJSON.CEmptyString(dataItem.LabID);
			dataItem.LabTestID = PJSON.CEmptyString(dataItem.LabTestID);
			dataItem.CPTCode = PJSON.CEmptyString(dataItem.CPTCode);
			dataItem.TestName = PJSON.CEmptyString(dataItem.TestName);

			var resultCode = dataItem.CPTCode;
			var result = '';
			switch (resultFormat) {
				case 'CPC':
					result = dataItem.CPTCode;
					break;
				case 'TN':
					result = dataItem.TestName;
					break;
				case '(CPC)TN':
					result = '(' + dataItem.CPTCode + ') ' + dataItem.TestName;
					break;
				case '(CPC)TN(TC)':
					var formattedString = '(' + dataItem.CPTCode + ') ' + dataItem.TestName;
					result = PJSON.IsNullOrEmptyOrUndefinedString(dataItem.TestCode) == true ? formattedString : formattedString + ' (' + dataItem.TestCode + ')';
					break;
			}
			var parsedItem = { data: dataItem, result: result, value: resultCode };
			return parsedItem;
		},
		formatItem: function (data, pos, max, val, query) {
			data.LabID = PJSON.CEmptyString(data.LabID);
			data.LabTestID = PJSON.CEmptyString(data.LabTestID);
			data.CPTCode = PJSON.CEmptyString(data.CPTCode);
			data.TestName = PJSON.CEmptyString(data.TestName);

			var formattedText = '';
			switch (listFormat) {
				case 'CPC':
					formattedText = data.CPTCode;
					break;
				case 'TN':
					formattedText = data.TestName;
					break;
				case '(CPC)TN':
					formattedText = '(' + data.CPTCode + ') ' + data.TestName;
					break;
				case '(CPC)TN(TC)':
					var formattedString = '(' + data.CPTCode + ') ' + data.TestName;
					formattedText = PJSON.IsNullOrEmptyOrUndefinedString(data.TestCode) == true ? formattedString : formattedString + ' (' + data.TestCode + ')';
					break;
			}
			return formattedText;
		},
		beforesuggest: function (input) {
			$imgObj.css({ 'display': 'inline' });
		},
		aftersuggest: function (input) {
			$imgObj.css({ 'display': 'none' });
		}
	};
	$jqTextBox.autocompleteJQU(vSearchURL, vSearchOptions).resultJQU(function (event, data, formatted) {
		//Set the values in the data object
		if (useDataMode == true) {
			$(this).data('ac_LabID', data.LabID);
			$(this).data('ac_LabTestID', data.LabTestID);
			$(this).data('ac_TestCode', data.TestCode);
			$(this).data('ac_TestName', data.TestName);
			$(this).data('ac_CPTCode', data.CPTCode);
			$(this).data('ac_LOINCCode', data.LOINCCode);
		}
		else {
			if ($(jqID_LabID).length == 1) { $(jqID_LabID).val(data.LabID); }
			if ($(jqID_LabTestID).length == 1) { $(jqID_LabTestID).val(data.LabTestID); }
			if ($(jqID_TestCode).length == 1) { $(jqID_TestCode).val(data.TestCode); }
			if ($(jqID_TestName).length == 1) { $(jqID_TestName).val(data.TestName); }
			if ($(jqID_CPTCode).length == 1) { $(jqID_CPTCode).val(data.CPTCode); }
			if ($(jqID_LOINCCode).length == 1) { $(jqID_LOINCCode).val(data.LOINCCode); }
		}


		//Determine the result to display
		data.CPTCode = PJSON.CEmptyString(data.CPTCode);
		data.TestName = PJSON.CEmptyString(data.TestName);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = data.CPTCode;
				break;
			case 'TN':
				result = data.TestName;
				break;
			case '(CPC)TN':
				result = '(' + data.CPTCode + ') ' + data.TestName;
				break;
			case '(CPC)TN(TC)':
				var formattedString = '(' + data.CPTCode + ') ' + data.TestName;
				result = PJSON.IsNullOrEmptyOrUndefinedString(data.TestCode) == true ? formattedString : formattedString + ' (' + data.TestCode + ')';
				break;
		}


		//Save the values into the hidden fields
		if (resetValuesPostSelection == true) {
			$(this).val('');
			$(this).focus();
		}
		else {
			$(this).val(result);
		}

		//Trigger the call back function with selected values as parameters
		if (typeof (onSelectCallBackFunctionName) == 'function') {
			onSelectCallBackFunctionName(data);
		}
	});

	//Set the place holder text
	$jqTextBox.attr('placeholder', placeHolderText);


	//Bind the change event because, if text is changed, then hidden values also need to change
	$jqTextBox.bind('blur', function () {
		//Get the hidden values
		var cptCode = '';
		var testName = '';
		var testCode = '';
		if (useDataMode == true) {
			cptCode = $(this).data('ac_CPTCode');
			testName = $(this).data('ac_TestName');
			testCode = $(this).data('ac_TestCode');
		}
		else {
			cptCode = $(jqID_CPTCode).val();
			testName = $(jqID_TestName).val();
			testCode = $(jqID_TestCode).val();;
		}

		//Form the expected text box value using hidden values
		cptCode = PJSON.CEmptyString(cptCode);
		testName = PJSON.CEmptyString(testName);
		var result = '';
		switch (resultFormat) {
			case 'CPC':
				result = cptCode;
				break;
			case 'TN':
				result = testName;
				break;
			case '(CPC)TN':
				result = '(' + cptCode + ') ' + testName;
				break;
			case '(CPC)TN(TC)':
				var formattedString = '(' + cptCode + ') ' + testName;
				result = PJSON.IsNullOrEmptyOrUndefinedString(testCode) == true ? formattedString : formattedString + ' (' + testCode + ')';
				break;
		}


		//Compare expected and actual values, if mis-matched, then reset the hidden value contents
		if (result != $(this).val()) {
			$(this).val('');
			if (useDataMode == true) {
				$(this).data('ac_LabID', '');
				$(this).data('ac_LabTestID', '');
				$(this).data('ac_TestCode', '');
				$(this).data('ac_TestName', '');
				$(this).data('ac_CPTCode', '');
				$(this).data('ac_LOINCCode', '');
			}
			else {
				$(jqID_LabID).val('');
				$(jqID_LabTestID).val('');
				$(jqID_TestCode).val('');
				$(jqID_TestName).val('');
				$(jqID_CPTCode).val('');
				$(jqID_LOINCCode).val('');
			}
		}
	});


	$jqTextBox.bind('UnbindAutoComplete', function () {
		//Unbind the auto-complete
		$jqTextBox.unautocompleteJQU();

		//Unbind custom Events
		$jqTextBox.unbind('blur');

		//Clear the attributes
		if (resetValuesOnUnbind == true) {
			$jqTextBox.val('');
			$jqTextBox.attr('placeholder', '');
			if (useDataMode == true) {
				$(this).removeData();
			}
			else {
				$(jqID_LabID).val('');
				$(jqID_LabTestID).val('');
				$(jqID_TestCode).val('');
				$(jqID_TestName).val('');
				$(jqID_CPTCode).val('');
				$(jqID_LOINCCode).val('');
			}
		}

		//Hide the progress image
		$imgObj.css({ 'display': 'none' });
	});


	//Mark the auto-complete for binding
	$jqTextBox.data('ac_IsAlreadyBinded', true);
}

function PEMR_UnBindAutoComplete(jqID_TextBox) {
	//Validate the inputs
	$jqTextBox = $(jqID_TextBox);
	if ($jqTextBox.length <= 0) { return false; }


	//Check if the auto-complete is already binded
	var ac_IsAlreadyBinded = PJSON.CBooltruefalse($jqTextBox.data('ac_IsAlreadyBinded'));
	if (ac_IsAlreadyBinded == true) {
		//trigger the unbind-autocomplete event
		$jqTextBox.trigger('UnbindAutoComplete');
		$jqTextBox.unbind('UnbindAutoComplete');
		$jqTextBox.removeData();
	}
	$jqTextBox = null;
}


//===============================================================================
//We can use this object instance to fetch the practice configuration value
//upon first time call, the return value will be cached so that
//from next time onwards object will be returned from cache.
//===============================================================================
function PEMR_PracticeConfiguration() {
	//Variables
	this.serviceURL = '';
	this.configList = new Array();

	//Functions
	this.GetConfigValueFromService = function (configName) {

		// ALL_CONFIG is a global variable populated by PatientEncounter.aspx.cs file
		// Use this to look up most PracticeConfiguration variables
		// This will avoid calling the web service
		if (window["ALL_CONFIG"] != undefined && ALL_CONFIG != null) {
			if (ALL_CONFIG[configName] != null && ALL_CONFIG[configName] != undefined)
				return ALL_CONFIG[configName];
		}
		else {
			// Initialize variable, if it does not exist
			ALL_CONFIG = {};
		}
		try {
			//Set the service url if empty
			if (this.serviceURL == '') {
				this.serviceURL = window.location.protocol + '//' + window.location.host + '/Services/UserPageSearchHelper.svc/GetPracticeConfigurationValue?ConfigName=';
			}

			//Set the service url if empty
			var configObject = null;

			//Call the webservice to fetch the config value
			$.ajax({
				url: this.serviceURL + configName,
				type: "GET",
				contentType: "application/json; charset=utf-8",
				timeout: 30000,
				async: false,
				dataType: "json",
				success: function (returnData) {
					if (returnData != null) {
						configObject = returnData;
						// Add this variable to the global ALL_CONFIG, if it does not exist
						if (ALL_CONFIG != null && ALL_CONFIG.configName == undefined)
							ALL_CONFIG[configName] = configObject;
					}
				}
			});

			//return the configuration data
			return configObject;
		}
		catch (ex) {
			return null;
		}
	}
	// calls the service GetPracticeConfigurationValue asynchronosly and executes the callback function in the success 
	this.GetConfigValueFromServiceAsync = function (configName, callbackFunction) {
		// ALL_CONFIG is a global variable populated by PatientEncounter.aspx.cs file
		// Use this to look up most PracticeConfiguration variables
		// This will avoid calling the web service
		if (window["ALL_CONFIG"] != undefined && ALL_CONFIG != null) {
			if (ALL_CONFIG[configName] != null && ALL_CONFIG[configName] != undefined) {
				if (callbackFunction !== undefined) {
					callbackFunction(ALL_CONFIG[configName]);
				}
				return ALL_CONFIG[configName];
			}
		}
		else {
			// Initialize variable, if it does not exist
			ALL_CONFIG = {};
		}
		try {
			//Set the service url if empty
			if (this.serviceURL == '') {
				this.serviceURL = window.location.protocol + '//' + window.location.host + '/Services/UserPageSearchHelper.svc/GetPracticeConfigurationValue?ConfigName=';
			}

			//Set the service url if empty
			var configObject = null;

			//Call the webservice to fetch the config value
			$.ajax({
				url: this.serviceURL + configName,
				type: "GET",
				contentType: "application/json; charset=utf-8",
				timeout: 30000,
				dataType: "json",
				success: function (returnData) {
					if (returnData != null) {
						configObject = returnData;
						// Add this variable to the global ALL_CONFIG, if it does not exist
						if (ALL_CONFIG != null && ALL_CONFIG.configName == undefined) {
							ALL_CONFIG[configName] = configObject;
						}
						if (callbackFunction !== undefined) {
							callbackFunction(returnData);
						}
					}
				}
			});

			//return the configuration data
			return configObject;
		}
		catch (ex) {
			return null;
		}
	}
	this.GetConfigValue = function (configName) {
		//Check if the value exists in the cache if useCache=true
		var configObject = null;
		if (this.configList.length > 0) {
			$.each(this.configList, function (cIdx, cObj) {
				if (cObj.ConfigName == configName) { configObject = cObj; return false; }
			});
			if (configObject != null) { return configObject; }
		}

		//Call the webservice to fetch the config value
		configObject = this.GetConfigValueFromService(configName);
		if (configObject != null) { this.configList.push(configObject); }
		return configObject;
	}
}
var PPracticeConfiguration = new PEMR_PracticeConfiguration();




var compareDatesHelperFunc = {
	convert: function (d) {
		// Converts the date in d to a date-object. The input can be:
		//   a date object: returned without modification
		//  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
		//   a number     : Interpreted as number of milliseconds
		//                  since 1 Jan 1970 (a timestamp)
		//   a string     : Any format supported by the javascript engine, like
		//                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
		//  an object     : Interpreted as an object with year, month and date
		//                  attributes.  **NOTE** month is 0-11.
		return (
			d.constructor === Date ? d :
			d.constructor === Array ? new Date(d[0], d[1], d[2]) :
			d.constructor === Number ? new Date(d) :
			d.constructor === String ? new Date(d) :
			typeof d === "object" ? new Date(d.year, d.month, d.date) :
			NaN
		);
	},
	compare: function (a, b) {
		// Compare two dates (could be of any type supported by the convert
		// function above) and returns:
		//  -1 : if a < b
		//   0 : if a = b
		//   1 : if a > b
		// NaN : if a or b is an illegal date
		// NOTE: The code inside isFinite does an assignment (=).
		return (
			isFinite(a = this.convert(a).valueOf()) &&
			isFinite(b = this.convert(b).valueOf()) ?
			(a > b) - (a < b) :
			NaN
		);
	},
	inRange: function (d, start, end) {
		// Checks if date in d is between dates in start and end.
		// Returns a boolean or NaN:
		//    true  : if d is between start and end (inclusive)
		//    false : if d is before start or after end
		//    NaN   : if one or more of the dates is illegal.
		// NOTE: The code inside isFinite does an assignment (=).
		return (
			isFinite(d = this.convert(d).valueOf()) &&
			isFinite(start = this.convert(start).valueOf()) &&
			isFinite(end = this.convert(end).valueOf()) ?
			start <= d && d <= end :
			NaN
		);
	}
}
//Splits large column table into multiple tables with first column as common
////tableToSplit: HTML table to split
////chunkSize: column size that splited table must have
function split_up_table(tableToSplit, chunkSize) {
	tableToSplit.find('thead tr:first td').replaceWith(function () {
		return $("<th />").append($(this).contents());
	});
	var $table = tableToSplit;
	var $tableFiltered = tableToSplit.clone();
	var cols = $("tr:first th", $tableFiltered).length - 1;

	//Removing empty columns - Criteria: checking for empty of parent cell of each column
	for (var col = 2; col <= cols; col++) {
		if ($('th:nth-child(' + col + ')', $tableFiltered).text().trim() == "") {
			$('td:nth-child(' + col + '),th:nth-child(' + col + ')', $tableFiltered).remove();
			cols = $("tr:first th", $tableFiltered).length - 1;
			col--;
		}
	}
	//As empty columns have been filtered reassign table length
	cols = $("tr:first th", $tableFiltered).length - 1;
	//Remove table and return if table doesn't contain data columns
	if (cols < 2) {
		$table.remove();
		return;
	}
	//Code to split table to multiple table with chunk size of columns and remove old table
	var n = cols / chunkSize;
	if (n.toString().indexOf('.') != '-1') {
		n = n + 1;
	}
	for (var i = 1; i <= n; i++) {
		var $newTable = $tableFiltered.clone().insertBefore($table);
		for (var j = cols + 1; j > 1; j--) {
			if (j + chunkSize - 1 <= chunkSize * i || j > chunkSize * i + 1) {
				$('td:nth-child(' + j + '),th:nth-child(' + j + ')', $newTable).remove();
			}
		}
		if ($('th', $newTable).length < 1) {
			$newTable.remove();
		}
		else {
			$("<br/>").insertBefore($table);
		}
	}
	$table.remove();
}

//For use in place of event.stopPropagation() function.
//Allows us to capture and log that an event was fired for usage analysis
function PEMR_StopEventPropagation(event) {
	//TODO: add logging code here

	if (event.stopPropagation != undefined) //for firefox
		event.stopPropagation();
	else //for ie
		event.cancelBubble = true;
	return false;
}

//For use in place of event.stopImmediatePropagation() function.
//Allows us to capture and log that an event was fired for usage analysis
function PEMR_StopImmediateEventPropagation(event) {

	//TODO: add logging code here

	event.stopImmediatePropagation();
}

//Handles uncheckable radio buttons
//Handles both knockout & non-knockout controls.
//Handles multi radio selection on parent selection - parent radio should have 'selectall' class
//vmToUpdate: pass this as empty incase its not a knockout call
(function ($) {
	$.fn.uncheckableRadio = function (vmToUpdate) {

		return this.each(function () {
			var radio = this;
			if ($('label[for="' + radio.id + '"]').length == 0) $(radio).parent().attr("for", radio.id);

			//MouseDown: This event is firing when radio button is checked
			$('label[for="' + radio.id + '"]').add(radio).bind('mousedown keydown' ,function (e) {
				if (!e) var e = window.event;
				if (e.which === 32 || e.type == "mousedown") {

					// If it is a signed form, not allowed to edit the radio button controls in a form
					if ($(radio).prop("disabled"))
						return false;

					var tblID = $(radio).closest("table").attr('id');
					var thIndex = $(radio).closest('th').index();
					var tdIndex = $(radio).closest('td').index() + 1;

					if ($(radio).closest('th').index() == -1) thIndex = tdIndex - 1;
					if ($(radio).closest('td').index() == -1) tdIndex = thIndex + 1;

					//add class to identify checked radios and check-it
					$(radio).addClass('isChecked');
					$(radio).data('isChecked', radio.checked);

					//object variables
					var selValue = $(radio).val();
					//var ClsName = tblID.toString() + selValue + colIndex
					var $headerRad = $('#' + tblID + ' thead tr th:eq(' + thIndex + ')').find('input[type="radio"][value="' + selValue + '"]');
					var $bodyRad = $('#' + tblID + ' tbody>tr>td:nth-child(' + tdIndex + ')').find('input[type="radio"][value="' + selValue + '"]');
					var $bodySelectedRad = $('#' + tblID + ' tbody>tr>td:nth-child(' + tdIndex + ')').find('input[type="radio"][value="' + selValue + '"]:checked');

					//check if total radio buttons with same value is checked if so check parent radio and update observable value with selected value
					//else: uncheck parent radio and update observable with empty
					if ($bodyRad.length == $bodySelectedRad.length + 1) {
						$headerRad.prop('checked', true);
						if (vmToUpdate != "")
							eval(vmToUpdate + "." + $headerRad.attr("data-bind").replace("checked:", "").toString() + "(\"" + $(radio).val() + "\");");
					}
					else {
						$headerRad.prop('checked', false);
						if (vmToUpdate != "")
						    eval(vmToUpdate + "." + $headerRad.attr("data-bind").replace("checked:", "").toString() + "(\"\");");
                            //else: this code is to uncheck other header checkboxes when element count is not same
						// allow when $headerRad[0] value is not equal to undefined.
						else if ($headerRad[0] != undefined) {
						    $('[name='+$headerRad[0].name+']').each(function () {
						        if ($(this).val() !== selValue) {
						            $(this).prop("checked", false);
						        }
						    });
						}
					}

					//check all child-radio's on parent-radio uncheck
					if ($(radio).hasClass('selectall')) {
						$bodyRad.prop("checked", true);

						if (vmToUpdate != "") {
							eval(vmToUpdate + "." + $(radio).attr("data-bind").replace("checked:", "").toString() + "(\"" + selValue + "\");");

							var $rad = $('#' + tblID + ' tbody>tr>td:nth-child(' + tdIndex + ')').find('input[type="radio"][value="' + selValue + '"]');
							$rad.each(function () {
								selValue = $(this).val();
								var obsName = $(this).attr("data-bind").replace("checked:", "");
								eval(vmToUpdate + "." + obsName.trim().toString() + "(\"" + selValue + "\");");
							});
						}
					}
					PEMR_StopImmediateEventPropagation(e);
				}
			});

			//Click: This event is firing when radio button is unchecked
			$('label[for="' + radio.id + '"]').add(radio).click(function (e) {

				// If it is a signed form, not allowed to edit the radio button controls in a form
				if ($(radio).prop("disabled"))
					return false;

				var tblID = $(radio).closest("table").attr('id');
				var thIndex = $(radio).closest('th').index();
				var tdIndex = $(radio).closest('td').index() + 1;

				if ($(radio).closest('th').index() == -1) thIndex = tdIndex - 1;
				if ($(radio).closest('td').index() == -1) tdIndex = thIndex + 1;

				//if isChecked class is there remove the class and uncheck the radio
				if ($(radio).data('isChecked')) {
					$(radio).removeClass('isChecked');
					radio.checked = false;

					var selValue = $(radio).val();
					//var ClsName = tblID.toString() + selValue + colIndex

					//object variables
					var $headerRadio = $('#' + tblID + " thead tr th:eq(" + thIndex + ")").find("input[type='radio'][value='" + selValue + "']");
					//uncheck parent-radio on any of child-radio unceck and update observable to empty
					$headerRadio.prop('checked', false);
					if (vmToUpdate != "")
						eval(vmToUpdate + "." + $headerRadio.attr("data-bind").replace("checked:", "").trim().toString() + "(\"\");");

					//update unchecked observable value to empty
					if (vmToUpdate != "")
						eval(vmToUpdate + "." + $(radio).attr("data-bind").replace("checked:", "").trim().toString() + "(\"\");");

					//uncheck all child-radio's on parent-radio uncheck and update observable value to empty
					if ($(radio).hasClass('selectall')) {
						selValue = $(radio).val();
						var $rad = $('#' + tblID + ' tbody>tr>td:nth-child(' + tdIndex + ')').find('input[type="radio"][value="' + selValue + '"]');
						$rad.prop("checked", false);

						if (vmToUpdate != "") {
							$rad.each(function () {
								var obsName = $(this).attr("data-bind").replace("checked:", "");
								eval(vmToUpdate + "." + obsName.trim().toString() + "(\"\");");
							});
						}
					}
				}
				PEMR_StopImmediateEventPropagation(e);
			});
		});

	};
})(jQuery);
(function ($) {
	$.fn.uncheckableSingleRadio = function (vmToUpdate) {
		return this.each(function () {
			var radio = this;
			var koObject = "";
			//If view model is not blank then find data-bind attribute value of respective radio button,if its value contains 'checked:' then split attribute value by "checked:" and consider second element of array(Ex: 'data-bind="checked: tbFSDRNumbnessRD2, disable: tbFSDRVisit2ESignStatus"' in TB App FlowSheet Tab)  
			if (vmToUpdate != "") {
				koObject = $(radio).attr("data-bind").toString();
				koObject = koObject.indexOf('checked:') != -1 ? koObject.split('checked:')[1].split(',')[0].trim() : koObject.toString().trim();
				// koObject.replace("checked:", "").toString()
			}
			//MouseDown: This event is firing when radio button is checked
			$('label[for="' + radio.id + '"]').add(radio).mousedown(function (e) {
				//add class to identify checked radios and check-it
				$(radio).addClass('isChecked');
				$(radio).data('isChecked', radio.checked);

				//object variables
				var selValue = $(radio).val();

				if (vmToUpdate != "") {
					eval(vmToUpdate + "." + koObject + "(\"" + selValue + "\");");
				}
				PEMR_StopImmediateEventPropagation(e);
			});
			//Click: This event is firing when radio button is unchecked
			$('label[for="' + radio.id + '"]').add(radio).click(function (e) {
				//if isChecked class is there remove the class and uncheck the radio
				if ($(radio).data('isChecked')) {
					$(radio).removeClass('isChecked');
					radio.checked = false;
					//update unchecked observable value to empty
					if (vmToUpdate != "")
						eval(vmToUpdate + "." + koObject + "(\"\");");
				}
				PEMR_StopImmediateEventPropagation(e);
			});
		});
	};
})(jQuery);
//Handles uncheckable radio buttons
//Handles non-knockout controls.
//Handles single radio button check and uncheck and finally calls the callBackFunction function which is passed to this function, if the parameter is not empty
//Based on check or uncheck execute the other functionality by passing the callBackFunction parameter
//How to call this fuction: $(".classNameofRadioButton").uncheckableSingleRadioWithCallBack(callBackfunction);
//Ex: $(".dfbc-pehr-uncheckRadioWithCallBack").uncheckableSingleRadioWithCallBack(MDBH_Forms_EnableDisableTextBox); where MDBH_Forms_EnableDisableTextBox-->is callback functions
(function ($) {
    $.fn.uncheckableSingleRadioWithCallBack = function (callBackFunction) {
        return this.each(function () {
            var radio = this;
            //MouseDown: This event is firing when radio button is checked
            $('label[for="' + radio.id + '"]').add(radio).bind('mousedown keydown', function (e) {
                //add class to identify checked radios and check-it
                $(radio).addClass('isChecked');
                $(radio).data('isChecked', radio.checked);

                //object variables
                var selValue = $(radio).val();
                if (callBackFunction == "") {
                    PEMR_StopImmediateEventPropagation(e);
                }
            });
            //Click: This event is firing when radio button is unchecked
            $('label[for="' + radio.id + '"]').add(radio).click(function (e) {
                //if isChecked class is there remove the class and uncheck the radio
                if ($(radio).data('isChecked')) {
                    $(radio).removeClass('isChecked');
                    radio.checked = false;
                }
                if (callBackFunction == "") {
                    PEMR_StopImmediateEventPropagation(e);
                }
                else {  //If callBackFunction is not empty, that function will be called finally
                    callBackFunction(this);
                }
            });
        });
    };
})(jQuery);
function DisplayVersionWarningText() {

	var pathParts = window.location.pathname.split('/');

	var s = 'EHR';

	if (pathParts[1].toLowerCase() == 'patientportal')
		s = 'Patient Portal'

	//if (getInternetExplorerVersion() != -1 || $.browser.opera || ($.browser.mozilla && Number($.browser.version) < 38)) {
	if (($.browser.mozilla == false && getUserBrowserandVersion().Name != "Chrome") || ($.browser.mozilla && Number($.browser.version) < 38)) {
		var b = '<strong>Patagonia Health ' + s + ' is not supported on this browser.<br/></strong>';
		b += 'Please use Mozilla Firefox version 38.0 or greater\n';
		b += 'Download the latest version of <a href="http://www.mozilla.com/">Mozilla Firefox here<a/> \n';
		$('#supportStatus').append(b).show();
		// $('[id$="LoginButton"]').prop('disabled', true);
		alert("Unsupported browser version");
	}
	else {
		$('#supportStatus').empty().hide();
	}

}
function getUserBrowserandVersion() {
	var userBrowser = { Name: null, Version: null };
	var ua = navigator.userAgent, tem,
	M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if (/trident/i.test(M[1])) {
		tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
		userBrowser.Name = 'IE';
		userBrowser.Version = tem[1];
		return userBrowser;
	}
	if (M[1] === 'Chrome') {
		tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
		if (tem != null) {
			userBrowser.Name = tem[1].replace('OPR', 'Opera');
			userBrowser.Version = tem[2];
			return userBrowser;
		}
	}
	M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
	if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]); {
		userBrowser.Name = M[0];
		userBrowser.Version = M[1];
		return userBrowser;
	}
}
// Table Operations
//Function Focuses the last control in first td in the dynamically created Column
function PEMR_FocusOnNewTableColumn(tableID) {
	var table = "#" + tableID;
	var $div = $(table).parent();
	$div.animate({ scrollLeft: $(table).width() });
	$('html,body').animate({ scrollTop: $div.offset().top - 200 });
	$(table + " tr:first th:last").children(':last').focus();
}

//Freezing first-left column of table  on div scroll
function PEMR_FreezeFirstColumn(divID, tableID) {
	$(divID).on('scroll', function () {
		var pos = $(divID).scrollLeft();
		if (pos == 0) {
			$.each($(tableID + " tr"), function (index) {
				if ($(this).find("th,td").eq(0).hasClass("freez") == true)
					$(this).find("th,td").eq(0).removeClass("freez");
			});
			$(tableID).css('width', '100%');
		}
		else {
			$.each($(tableID + " tr"), function (index) {
				if ($(this).find("th,td").eq(0).hasClass("freez") == false) {
					$(this).find("th,td").eq(0).addClass("freez");
					$(this).find("th").eq(1).height($(this).find("th").eq(0).height());
					$(this).find("th").eq(0).height($(this).find("th").eq(1).height());
					$(this).find("td:visible").eq(1).height($(this).find("td:visible").eq(0).height());
					$(this).find("td:visible").eq(0).height($(this).find("td:visible").eq(1).height());
					$(tableID).css('width', '101%');
				}

			});
		}
	});
}

function PEMR_ConfirmDialog(givenOptions) {
	//Format the inputs

	//Text to be displayed in the confirmation dialog title
	givenOptions.title = PJSON.CEmptyString(givenOptions.title);
	//Message to be displayed, this is a mandatory field
	givenOptions.confirmMessage = PJSON.CEmptyString(givenOptions.confirmMessage);
	if (givenOptions.confirmMessage == '') return false;
	//Dialog width is an integer value in pixels
	givenOptions.width = PJSON.CInteger(givenOptions.width);
	//Dialog height is an integer value in pixels
	givenOptions.height = PJSON.CInteger(givenOptions.height);
	//Text to be displayed on the Yes button, By default 'Yes' text will be displayed  
	givenOptions.yesText = PJSON.CEmptyString(givenOptions.yesText);
	//Text to be displayed on the No button, By default 'No' text will be displayed  
	givenOptions.noText = PJSON.CEmptyString(givenOptions.noText);
	//yesFunction will be called after click on Yes button
	if (typeof (givenOptions.yesFunction) != 'function') givenOptions.yesFunction = null;
	//noFunction will be called after click on No button
	if (typeof (givenOptions.noFunction) != 'function') givenOptions.noFunction = null;

	//Construct the dialog
	var dialogOptions = {
		autoOpen: false,
		draggable: false,
		resizable: false,
		closeOnEscape: false,
		modal: true,
		width: ((givenOptions.width != 0) ? givenOptions.width : parseInt(screen.width / 2) - 150),
		height: ((givenOptions.height != 0) ? givenOptions.height : 250),
		title: ((givenOptions.title != '') ? givenOptions.title : 'Confirm Dialog'),
		buttons: [
		{
			text: ((givenOptions.yesText != '') ? givenOptions.yesText : "Yes"),
			icons: { primary: "ui-icon-circle-check" },
			click: function () {
				$(this).dialog("close");
				if (givenOptions.yesFunction != null) { givenOptions.yesFunction(); }
				else { return true; }
			}
		},
		{
			text: ((givenOptions.noText != '') ? givenOptions.noText : "No"),
			icons: { primary: "ui-icon-circle-close" },
			click: function () {
				$(this).dialog("close");
				if (givenOptions.noFunction != null) { givenOptions.noFunction(); }
				else { return false; }
			}
		}]
	};
	$('<div>' + givenOptions.confirmMessage + '</div>').dialog(dialogOptions).dialog("open");
}

function PEMR_AlertDialog(givenOptions) {
	//Format the inputs

	//Text to be displayed in the alert dialog title
	givenOptions.title = PJSON.CEmptyString(givenOptions.title);
	//Message to be displayed, this is a mandatory field
	givenOptions.alertMessage = PJSON.CEmptyString(givenOptions.alertMessage);
	if (givenOptions.alertMessage == '') return false;
	//Dialog width is an integer value in pixels
	givenOptions.width = PJSON.CInteger(givenOptions.width);
	//Dialog height is an integer value in pixels
	givenOptions.height = PJSON.CInteger(givenOptions.height);
	//Text to be displayed on the OK button, By default 'OK' text will be displayed  
	givenOptions.okText = PJSON.CEmptyString(givenOptions.okText);
	//Call the okFunction after click on OK button
	if (typeof (givenOptions.okFunction) != 'function') givenOptions.okFunction = null;

	var dialogOptions = {
		autoOpen: false,
		draggable: false,
		resizable: false,
		closeOnEscape: true,
		modal: true,
		width: ((givenOptions.width != 0) ? givenOptions.width : parseInt(screen.width / 2) - 150),
		height: ((givenOptions.height != 0) ? givenOptions.height : 250),
		title: ((givenOptions.title != '') ? givenOptions.title : 'Alert Dialog'),
		buttons: [
		{
			text: ((givenOptions.okText != '') ? givenOptions.okText : "OK"),
			icons: { primary: "ui-icon-circle-check" },
			click: function () {
				$(this).dialog("close");
				if (givenOptions.okFunction != null) { givenOptions.okFunction(); }
				else { return true; }
			}
		}]
	};
	$('<div>' + givenOptions.alertMessage + '</div>').dialog(dialogOptions).dialog("open");
}
/*=================[Service Code Options html Realted]=====================================================================
--> PEMR_GetServiceCodesOptionHtml function is used to retrieve service codes option html for EncounterNote,ProgressNote & Maryland

--> When function PEMR_GetServiceCodesOptionHtml is called then
	it initially checks PEMR_SerivceCodesOptionHtml for required data in cache  based on codetype(EN,PN,MD) and returns if available, 
	otherwise it makes a service call and caches the received data in PEMR_SerivceCodesOptionHtml Global helper object before return.

--> PEMR_GetServiceCodesOptionHtml function has 2 input parameters,
	1.codeType: indicates the type of service codes to be retrieved from DB/Cache (PEMR_ServiceCodeType:EN,PN,MD).
	2.defaultTitle: this is the default text to be displayed for a no-select option.
==============================================================================================================================*/
var PEMR_SerivceCodesOptionHtml = {
	PN: null,
	EN: null,
	MD: null,
	TC: null,
	CO: null,
	HI: null,
	CH: null,
	MI: null,
	HV: null,
	TC: null
};
function PEMR_GetServiceCodesOptionHtml(codeType, defaultTitle) {
	console.log('::' + codeType + ':: PEMR_GetServiceCodesOptionHtml triggered at: [' + new Date() + ']');
	try {
		// Checking PEMR_SerivceCodesOptionHtml object for requested codeType data
		defaultTitle = PJSON.IsNullOrEmptyOrUndefinedString(defaultTitle) == true ? 'DEFAULT_TITLE' : defaultTitle;
		if (!PEMR_SerivceCodesOptionHtml[codeType]) {
			// if data not found then makes a service call and cache the return data in PEMR_SerivceCodesOptionHtml object
			PEMR_SerivceCodesOptionHtml[codeType] = null;
			console.log('::' + codeType + ':: PEMR_GetServiceCodesOptionHtml Service Called at: [' + new Date() + ']');
			var serviceUrl = window.location.protocol + '//' + window.location.host
						   + '/Services/ProgressNoteServiceProxy.svc/GetServiceCodeOptionHtml?CodeType=' + codeType
						   + '&DefaultOptionTitle='+defaultTitle +'&IncludeCodeInTitle=true&IncludeModifierInCode=true';
			$.ajax({
				url: serviceUrl,
				type: 'GET',
				async: false,
				success: function (data, textStatus, XMLHttpRequest) {
					if (PJSON.IsNullOrEmptyOrUndefinedString(data) == false) {
						PEMR_SerivceCodesOptionHtml[codeType] = data;
					}
					else {
						PEMR_LogInFBC('Invalid/No service codes found.', 'PEMR_GetServiceCodesOptionHtml');
					}
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					PEMR_LogInFBC_WCFError('PEMR_GetServiceCodesOptionHtml', XMLHttpRequest, textStatus, errorThrown);
					return false;
				}
			});
		}
		var optionsHtml = PEMR_SerivceCodesOptionHtml[codeType];
		//Checks the optionsHtml in PEMR_SerivceCodesOptionHtml object and replaces the DEFAULT_TITLE with selectedOption value
		//if optionsHtml is not found then returns the defaultHtml
		if (!PJSON.IsNullOrEmptyOrUndefinedString(optionsHtml))
			optionsHtml = optionsHtml.replace('DEFAULT_TITLE', defaultTitle);
		else
			optionsHtml = '<option cpt="" cpttitle="" mod="" value="">' + defaultTitle + '</option>';
		return optionsHtml;
	}
	catch (ex) {
		PEMR_LogInFBC('PEMR_GetServiceCodesOptionHtml', ex.message);
		return '<option cpt="" cpttitle="" mod="" value="">' + defaultTitle + '</option>';
	}
}

/*==================================[Provider Details Related]==============================================================
--> PEHR_GetProviderDetails function is used to retrieve Provider Details

--> When function PEHR_GetProviderDetails is called then
	it initially checks in Global_ProviderDetails array with userID if details found then invokes the callback function by 
	passing provider details to it,	otherwise it makes a service call and caches the received data in Global_ProviderDetails
	Global helper array and invokes the callback function.

--> PEHR_GetProviderDetails function has input parameters 
	UserID:	used to retrieve Provider Details from DB/Cache (PEMR_ProviderDetails),
	callbackFunc: will be invoked after obtaining Provider Details from cache or service by passing Provider Details as input
	parameter.
==============================================================================================================================*/
var Global_ProviderDetails = [];
function PEHR_GetProviderDetails(userID, callbackFunc) {
	var providerObj = null;
	if (Global_ProviderDetails.length > 0) {
		providerObj = Global_ProviderDetails.filter(searchProviderDetail);
		if (providerObj.length > 0) {
			//console.log("From Cache : " + providerObj[0].Name);
			callbackFunc(providerObj[0]);
		}
		else {
			getProviderDetailFromService();
		}
	}
	else {
		getProviderDetailFromService();
	}
	function searchProviderDetail(providerObj) {
		if (providerObj.ID == userID) {
			return providerObj;
		}
	}
	function getProviderDetailFromService() {
		var serviceURL = '/Services/UtilityFunctionsProxy.svc/GetProviderDetails/' + userID;
		$.ajax({
			url: serviceURL,
			type: "GET",
			contentType: "application/json; charset=utf-8",
			timeout: 30000,
			dataType: "json",
			async: true,
			success: function (returnData) {
				//console.log("From Async Service : " + returnData.Name);
				if (returnData != null) {
					for (key in returnData) {
						returnData[key] = PJSON.CEmptyString(returnData[key]);
					}
					if (returnData.Title != "") {
						returnData.NameWithTitle = returnData.Name + ', ' + returnData.Title;
					}
					else {
						returnData.NameWithTitle = returnData.Name;
					}
					providerObj = Global_ProviderDetails.filter(searchProviderDetail);
					if (providerObj.length == 0) {
						Global_ProviderDetails.push(returnData);
					}
					callbackFunc(returnData);
				}
				else {
					callbackFunc(null);
				}
			},
			error: function (XMLHttpRequest, textStatus, errorThrown) {
				PEMR_LogInFBC_WCFError('PEHR_GetProviderDetails', XMLHttpRequest, textStatus, errorThrown);
				return false;
			}
		});
	}
}
//[
//    {"Key":"utcMinuteOffset","Value":"330"}
//    ,{"Key":"TzDisplayName","Value":"(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi"}
//    ,{"Key":"TzStandardName","Value":"India Standard Time"}
//    ,{"Key":"TzSupportsDaylightSavingTime","Value":"False"}
//]

var PPracticeTimeZone = (function () {
	var moduleObj = {};
	// Creating a global object to hold practice zone details
	var tzDetails = {
		utcMinuteOffset: "",
		tzDisplayName: "",
		tzStandardName: "",
		tzSupportsDaylightSavingTime: ""
	}
	//using proxy getting the practice zone details such as  utcMinuteOffset,tzDisplayName,tzStandardName,tzSupportsDaylightSavingTime in dictionary reading
	//them and populating the values into global object.
	function getDetailsFromService() {
		tzDetails = null;
		try {
			var serviceUrl = window.location.protocol + '//' + window.location.host
						   + '/Services/UtilityFunctionsProxy.svc/GetPracticeTimeZoneDetails';
			$.ajax({
				url: serviceUrl,
				type: 'GET',
				async: false,
				success: function (data, textStatus, XMLHttpRequest) {
					if (data != undefined && data != null) {
						tzDetails = {};
						$.each(data, function (idx, obj) {
							if (obj['Key'].toLowerCase() == 'utcminuteoffset') {
								tzDetails.utcMinuteOffset = obj['Value'].toString();
							}
							else if (obj['Key'].toLowerCase() == 'tzdisplayname') {
								tzDetails.tzDisplayName = obj['Value'].toString();
							}
							else if (obj['Key'].toLowerCase() == 'tzstandardname') {
								tzDetails.tzStandardName = obj['Value'].toString();
							}
							else if (obj['Key'].toLowerCase() == 'tzsupportsdaylightsavingtime') {
								tzDetails.tzSupportsDaylightSavingTime = obj['Value'].toString();
							}
						});
					}
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					tzDetails = null;
					PEMR_LogInFBC_WCFError('PEMR_PracticeTimeZone.getDetailsFromService', XMLHttpRequest, textStatus, errorThrown);
				}
			});
		}
		catch (ex) {
			tzDetails = null;
			PEMR_LogInFBC('PEMR_PracticeTimeZone.getDetailsFromService', ex.message);
		}
	}

	moduleObj.GetTimeZoneOffset = function () {

		// if tzDetails object is not empty or null retreiving the values from the object or else making service call to get the details of practice time zone
		if (tzDetails.utcMinuteOffset != null && tzDetails.utcMinuteOffset != '') {
			return tzDetails.utcMinuteOffset;
		}
		else {
			getDetailsFromService();
			return tzDetails.utcMinuteOffset;
		}
	}
	moduleObj.GetPracticeTimeZoneDateInUTC = function (dateTimeString) {
		//Input: MST(-420), '12/31/2015 05:00 PM'
		//Output: Fri, 01 Jan 2016 00:00:00 GMT

		//Fetch the practice offset in minutes
		var practiceUTCOffsetInMinutes = this.GetTimeZoneOffset();
		var msecInMin = 60000;
		var givenDateObj = new Date(dateTimeString);
		//Add both practice timezone offset to date
		var givenDateObj1 = new Date(givenDateObj.getTime() + ((-1 * practiceUTCOffsetInMinutes) * msecInMin));
		//Add the current timezone offset to the above date
		var givenDateObj2 = new Date(givenDateObj1.getTime() + ((-1 * givenDateObj.getTimezoneOffset()) * msecInMin));
		return givenDateObj2.toUTCString();
	}

	return moduleObj;
}());
// Don't call GetTimeZoneOffset. It is only used when patient vitals are saved. 
//PPracticeTimeZone.GetTimeZoneOffset();// Triggering the Get practice Zone Details



/*==================================[Patient Details Related]==============================================================
--> PEHR_GetPatientDetailsByID function is used to retrieve Patient details if patientID is provided as input
	If an error occurs then this function returns null
==============================================================================================================================*/
var PEHR_GetPatientDetailsByID = function (patientID) {
	var serviceURL = window.location.protocol + "//" + window.location.host + "/Services/PatientDemographicsServiceProxy.svc/GetPatientDetailsByID";
	serviceURL += "?iPatientID=" + patientID;
	var patData = null;
	$.ajax({
		url: serviceURL,
		type: "GET",
		contentType: "application/json; charset=utf-8",
		timeout: 30000,
		dataType: "json",
		async: false,
		success: function (data, textStatus, XMLHttpRequest) {
			if (data != undefined && data != null) {
				patData = data;
			}
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			patData = null;
			PEMR_LogInFBC_WCFError('PEHR_GetPatientDetailsByID', XMLHttpRequest, textStatus, errorThrown);
		}
	});
	return patData;
}

/*==================================[User Role Related]==============================================================
--> PEMR_DoesUserHaveRole function is used to check if User has privilege or not on the userRole provided as input
==============================================================================================================================*/
function PEMR_DoesUserHaveRole(userRole) {
	//Call the save web service
	var serviceURL = window.location.protocol + '//'
			+ window.location.host
			+ '/Services/UserPageSearchHelper.svc/DoesUserHaveRole?userRole=' + '' + userRole + '';
	return $.ajax({
		url: serviceURL,
		type: "GET",
		contentType: "application/json; charset=utf-8",
		timeout: 90000,
		dataType: "json",
		async: false
	});
}

/*==================================[Place of Service]==============================================================
--> PEMR_GetPlaceOfService function is used to get the place of service options or Obj based param
==============================================================================================================================*/
var PEMR_PlaceOfSerivce_NewObject_KO = function () {
	this.code = "0";
	this.text = "";
	this.displayValue = "";
};
var PEMR_PlaceOfSerivce_List = null;
var PEMR_PlaceOfService_ArraySortFunction = null;

/*--------------------------------------------------------------------------------
PEMR_PlaceOfService_GetOptionHtml: 
	This function is used to fetch place of service  options html 

PARAMETERS:
	displayFormat              :  based on this option display text will be defined
	emptyOptionValue           :  this param defines value for empty option(i.e option which is to be selected if no other option is requried)
	emptyOptionText            :  this param defines text of empty option(i.e option which is to be selected if no other option is requried)
	defaultOptionValueToSelect :  This is the defaultOption which has to be selected when the control loads.

NOTE:
	If both emptyOptionValue & emptyOptionText are empty then this function will not render empty select option.

RETURNS:
	Empty       : When expection/error/no-data-found
	Option Html : When records found
--------------------------------------------------------------------------------*/
function PEMR_PlaceOfService_GetOptionHtml(displayFormat, emptyOptionValue, emptyOptionText, defaultOptionValueToSelect) {
	var retObj = '';

	//Format the given inputs
	displayFormat = PJSON.CEmptyString(displayFormat);
	emptyOptionValue = PJSON.CEmptyString(emptyOptionValue);
	emptyOptionText = PJSON.CEmptyString(emptyOptionText);
	defaultOptionValueToSelect = PJSON.CEmptyString(defaultOptionValueToSelect);


	try {
		// if data not found then makes a service call and cache the return data in PEMR_SerivceCodesOptionHtml object
		if (PJSON.IsNullOrEmptyOrUndefinedString(PEMR_PlaceOfSerivce_List) == true) {
			PEMR_PlaceOfSerivce_List = PEMR_PlaceOfService_GetDataFromService();
		}

		//Include empty option as the first option
		if (retObj == '' && (PJSON.IsNullOrEmptyOrUndefinedString(emptyOptionText) == false || PJSON.IsNullOrEmptyOrUndefinedString(emptyOptionValue) == false  )) {
			retObj = '<option value="' + emptyOptionValue + '">' + emptyOptionText + '</option>';
		}

		//Determine the option format based on displayFormat
		var optionFormat = '';
		switch (displayFormat) {
			case 'Value - Text':
				optionFormat = '<option value="#POS_VALUE#" #POS_SEL_STATUS#>#POS_VAL# - #POS_TEXT#</option>';
				break;
			case 'Text':
				optionFormat = '<option value="#POS_VALUE#" #POS_SEL_STATUS#>#POS_TEXT#</option>';
				break;
		}

		//Loop through each record and form the option html
		var posSelStatus = '';
		$.each(PEMR_PlaceOfSerivce_List, function (iterator, object) {
			object.MCode = PJSON.CEmptyString(object.MCode);
			posSelStatus = object.MCode == defaultOptionValueToSelect? 'selected="selected"' : '';
			retObj = retObj + optionFormat.replace('#POS_VALUE#', object.MCode).replace('#POS_SEL_STATUS#', posSelStatus).replace('#POS_VAL#', object.MCode).replace('#POS_TEXT#', object.LookupDesc);
		});
		}
		
	catch (ex) {
		PEMR_LogInFBC('PEMR_PlaceOfService_GetOptionHtml', ex.message);
		retObj= '';
	}
	return retObj;
}


/*--------------------------------------------------------------------------------
PEMR_PlaceOfService_GetObjectList_KO: 
	This function is used to fetch place of service  KO compatible array object

PARAMETERS:
	displayFormat :  based on this option display text will be defined

RETURNS:
	Empty []      : When expection/error/no-data-found
	Object []     : KO Bindable POS object array
--------------------------------------------------------------------------------*/
function PEMR_PlaceOfService_GetObjectList_KO(displayFormat) {
	var retObj = [];
	try {
		if (PJSON.IsNullOrEmptyOrUndefinedString(PEMR_PlaceOfSerivce_List) == true) {
			// if data not found then makes a service call and cache the return data in PEMR_SerivceCodesOptionHtml object
			PEMR_PlaceOfSerivce_List = PEMR_PlaceOfService_GetDataFromService();
		}
		$.each(PEMR_PlaceOfSerivce_List, function (iterator, posObj) {
			var nObj = new PEMR_PlaceOfSerivce_NewObject_KO();
			nObj.code = posObj.MCode;
			nObj.text = posObj.LookupDesc;
			switch (displayFormat) {
				case 'Value - Text':
					nObj.displayValue = nObj.code + ' - ' + nObj.text;
					break;
				case 'Text':
					nObj.displayValue = nObj.text;
					break;
			}
			retObj.push(nObj);
		});
	}
	catch (ex) {
		PEMR_LogInFBC('PEMR_PlaceOfService_GetObjectList_KO', ex.message);
		retObj = [];
	}
	return retObj;
}

/*--------------------------------------------------------------------------------
PEMR_PlaceOfService_GetDataFromService: 
	This function loads the PEMR_PlaceOfSerivce_List variable with the POS data received from service.

RETURNS:
	POS Object List  : Data received from the server.
	null             : In case of error/exception/no-data
--------------------------------------------------------------------------------*/
function PEMR_PlaceOfService_GetDataFromService() {
	PEMR_PlaceOfSerivce_List = null;
	var serviceUrl = window.location.protocol + '//' + window.location.host
						   + '/Services/Lookupservice.svc/GetPlaceOfServiceList?useCache=true';
	$.ajax({
		url: serviceUrl,
		type: 'GET',
		async: false,
		success: function (data, textStatus, XMLHttpRequest) {
			if (PJSON.IsNullOrEmptyOrUndefinedString(data) == false) {
				//Filter unassigned data
				PEMR_PlaceOfSerivce_List = $.grep(data, function (posObj) {
					return posObj.LookupDesc != "Unassigned";
				});
				//Sort The Data
				if (typeof (PEMR_PlaceOfService_ArraySortFunction) != 'function') {
					PEMR_PlaceOfService_ArraySortFunction = PEMR_GetArrayDataSortFunction('PlaceOf', 'MCode', PSortType.Asc, PDataType.Integer);
				}
				if (typeof (PEMR_PlaceOfService_ArraySortFunction) == 'function') {
					PEMR_PlaceOfSerivce_List.sort(PEMR_PlaceOfService_ArraySortFunction);
				}
			}
			else {
				PEMR_LogInFBC('Invalid/No service codes found.', 'PEMR_PlaceOfService_GetDataFromService');
			}
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			PEMR_LogInFBC_WCFError('PEMR_PlaceOfService_GetDataFromService', XMLHttpRequest, textStatus, errorThrown);
		}
	});
	return PEMR_PlaceOfSerivce_List;
}

/*--------------------------------------------------------------------------------
PEMR_InitializeAuthentication_Token: 
	This function sets (and starts the automatic refresh) of the globally available authentication token
--------------------------------------------------------------------------------*/
function PEMR_InitializeTokenAuthentication() {
    //Is authentication helper script available?
    if (typeof AuthenticationHelper != "undefined") {
        //Has the script's global token variable been set to a token?
        if (typeof AUTHENTICATION_TOKEN == "undefined") 
            new AuthenticationHelper().initialize();

        //Setup message event to handle requests for tokens
        $(window).on("message", function (e) {
            if (e.originalEvent.data == "RequestToken") {
                var iFrameMessenger = new IFrameMessenger();

                //Check that the request is from a valid source
                if (iFrameMessenger.originValid(e.originalEvent.origin)) {
                    //send the token
                    iFrameMessenger.sendMessage(e.originalEvent.source, AUTHENTICATION_TOKEN);
                }
            }               
        });
    }
}
/*--------------------------------------------------------------------------------
PEMR_IsUserNameValid: 
	This function will validate the User Name
--------------------------------------------------------------------------------*/
function PEMR_IsUserNameValid(userName) {
	var PEMR_UserNameValid = 'Error';
	var serviceUrl = window.location.protocol + '//' + window.location.host
						   + "/services/PracticeConfigurationServiceProxy.svc/IsUserNameValid?userName=" + userName;
	$.ajax({
		url: serviceUrl,
		type: 'POST',
		async: false,
		success: function (data, textStatus, XMLHttpRequest) {
			if (data != undefined) {
				PEMR_UserNameValid = data;//returns  1: Valid, -1: Invalid, 0: Error
			}
			else
				PEMR_UserNameValid = "Error";
		},
		error: function (XMLHttpRequest, textStatus, errorThrown) {
			PEMR_UserNameValid = "Error";
		}
	});
	return PEMR_UserNameValid;
}

/*=================[Diagnosis Codes Options html Realted]=====================================================================
--> PEMR_GetDiagnosisCodesOptionHtml function is used to retrieve Diagnosis option html for Tobacco Cessation Forms

--> When function PEMR_GetDiagnosisCodesOptionHtml is called then
	it initially checks PEMR_DiagnosisOptionHtml for required data in cache  based on AppName('Tobacco Cessation') and returns if available, 
	otherwise it makes a service call and caches the received data in PEMR_DiagnosisOptionHtml Global helper object before return.

--> PEMR_GetDiagnosisCodesOptionHtml function has 2 input parameters,
	1.AppName: indicates the type of Diagnosis codes to be retrieved from DB/Cache ('Tobacco Cessation').
	2.DefaultDiagnosisOptionTitle: this is the default text to be displayed for a no-select option.
==============================================================================================================================*/
var PEMR_DiagnosisOptionHtml = {
	TC: null
};
function PEMR_GetDiagnosisCodesOptionHtml(AppName, DefaultDiagnosisOptionTitle) {
	console.log('::' + AppName + ':: PEMR_GetDiagnosisCodesOptionHtml triggered at: [' + new Date() + ']');
	try {
		// Checking PEMR_DiagnosisOptionHtml object for requested AppName data
		DefaultDiagnosisOptionTitle = PJSON.IsNullOrEmptyOrUndefinedString(DefaultDiagnosisOptionTitle) == true ? 'DEFAULT_TITLE' : DefaultDiagnosisOptionTitle;
		if (!PEMR_DiagnosisOptionHtml[AppName]) {
			// if data not found then makes a service call and cache the return data in PEMR_DiagnosisOptionHtml object
			PEMR_DiagnosisOptionHtml[AppName] = null;
			console.log('::' + AppName + ':: PEMR_GetDiagnosisCodesOptionHtml Service Called at: [' + new Date() + ']');
			var serviceUrl = window.location.protocol + '//' + window.location.host
						   + '/Services/ProgressNoteServiceProxy.svc/GetDiagnosisCodesOptionHtml?AppName=' + AppName
						   + '&DefaultDiagnosisOptionTitle=' + DefaultDiagnosisOptionTitle + '&UseCache=true';
			$.ajax({
				url: serviceUrl,
				type: 'GET',
				async: false,
				success: function (data, textStatus, XMLHttpRequest) {
					if (PJSON.IsNullOrEmptyOrUndefinedString(data) == false) {
						PEMR_DiagnosisOptionHtml[AppName] = data;
					}
					else {
						PEMR_LogInFBC('Invalid/No service codes found.', 'PEMR_GetDiagnosisCodesOptionHtml');
					}
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					PEMR_LogInFBC_WCFError('PEMR_GetDiagnosisCodesOptionHtml', XMLHttpRequest, textStatus, errorThrown);
					return false;
				}
			});
		}
		var optionsHtml = PEMR_DiagnosisOptionHtml[AppName];
		//Checks the optionsHtml in PEMR_DiagnosisOptionHtml object and replaces the DEFAULT_TITLE with selectedOption value
		//if optionsHtml is not found then returns the defaultHtml
		if (!PJSON.IsNullOrEmptyOrUndefinedString(optionsHtml))
			optionsHtml = optionsHtml.replace('DEFAULT_TITLE', DefaultDiagnosisOptionTitle);
		else
			optionsHtml = '<option data-icdcode="" data-icdtitle="" data-icd10code="" data-icd10title="" value="" data-sourcekey=""  data-sourcetype=""  data-snomedcode=""  data-snomeddesc=">' + DefaultDiagnosisOptionTitle + '</option>';
		return optionsHtml;
	}
	catch (ex) {
		PEMR_LogInFBC('PEMR_GetDiagnosisCodesOptionHtml', ex.message);
		return '<option data-icdcode="" data-icdtitle="" data-icd10code="" data-icd10title="" value="" data-sourcekey=""  data-sourcetype=""  data-snomedcode=""  data-snomeddesc=">' + DefaultDiagnosisOptionTitle + '</option>';
	}
}
//========[PEMR_GetDurationSelect_UTCStartAndEndDatesForESB]==========================
// Desc    :  This function will return start date and end date in UTC format based on selected duration
// Syntax  : var <nameVar> = PEMR_GetStartAndEndDatesByDuration(selectedOption);
// Returns : An object of structure {
//             Duration: <dString>, StartDate : <sdString>, EndDate : <edString>
//           }
//           (or)
//           null, in case of exception
// Paramerters:
// P01 : todayString   : is any valid date format that can be parsed by
//                       JS Date Object | 'today'.
// P02 : Duration    : is any valid value of PEMR_DurationSelectType
//==============================================================================
var PEMR_GetDurationSelect_UTCStartAndEndDatesForESB = function (todayString, durationSelectType) {
    try {
        if (todayString == 'today') {
            todayString = jQGetDateTimeString('mm/dd/yy', new Date().toString());
        }

        var today = new Date(todayString);
        var todayDate = today.getDate();
        var todayMonth = today.getMonth();
        var todayFullYear = today.getFullYear();

        var compSDString = '';
        var compEDString = todayString;
        switch (durationSelectType) {
            case PDurationSelectType.All:
                compSDString = null;
                compEDString = null;
                break;
            case PDurationSelectType.Today:
                compSDString = todayString;
                break;
            case PDurationSelectType.Week:
                compSDString = new Date(todayFullYear, todayMonth, (todayDate - 6)).toDateString();
                break;
            case PDurationSelectType.Month:
                compSDString = new Date(todayFullYear, (todayMonth - 1), todayDate).toDateString();
                break;
            case PDurationSelectType.ThreeMonths:
                compSDString = new Date(todayFullYear, (todayMonth - 3), todayDate).toDateString();
                break;
            case PDurationSelectType.TwelveMonths:
                compSDString = new Date((todayFullYear - 1), todayMonth, todayDate).toDateString();
                break;
            case PDurationSelectType.TwoYears:
                compSDString = new Date((todayFullYear - 2), todayMonth, todayDate).toDateString();
                break;
            case PDurationSelectType.ComingMonth:
                compEDString = new Date(todayFullYear, (todayMonth + 1), todayDate).toDateString();
                break;
            case PDurationSelectType.ComingWeek:
                compEDString = new Date(todayFullYear, todayMonth, (todayDate + 6)).toDateString();
                break;
            case PDurationSelectType.AllUpcoming:
                compEDString = new Date((todayFullYear + 2), todayMonth, todayDate).toDateString();
                break;
            case PDurationSelectType.Range:
                //Do nothing as the start and ends needs to be assigned explicitly
                break;
        }
       if (durationSelectType != PDurationSelectType.All) {
            compSDString = (new Date(compSDString + ' 00:00:00')).toUTCString();
            compEDString = (new Date(compEDString + ' 23:59:59')).toUTCString();
        }

        return {
            Duration: durationSelectType,
            StartDate:  compSDString,
            EndDate:  compEDString
        };
    }
    catch (ex) {
        return null;
    }
}

var IsPatientContactLogJSLoaded = false;

/*--------------------------------------------------------------------------------
PEMR_PatientContactLogJSLoaded: 
	This function retrieves the commonly used PatientContactLog.js file
--------------------------------------------------------------------------------*/
var PEMR_PatientContactLogJSLoaded = function () {
    if (!IsPatientContactLogJSLoaded) {
        var url = "/js/PatientContactLog.js";
        $.getScript(url);
        IsPatientContactLogJSLoaded = true;
    }
}
/*=================[Service Type Options html Realted]=====================================================================
--> PEMR_GetPracticeLookupDataByLookupKey function is used to retrieve practice lookup table data based on lookupkey.

--> When function PEMR_GetPracticeLookupDataByLookupKey is called then
	it initially checks for required lookup key data in cache , returns if available, 
	otherwise it will fetch from DB and updates the respective lookup key cache.

--> PEMR_GetPracticeLookupDataByLookupKey function parameters,
	lookupKey: based on lookup key respective lookupdata will be retrieved from DB/Cache.
	programID: based on Program respective lookup data will be retrieved from DB/Cache.
==============================================================================================================================*/
function PEMR_GetPracticeLookupDataByLookupKey(lookupKey,programID) {
	try {
		var ServiceTypesOptionHtml = '';
		var serviceURL = '../Services/PatientReferralOrderServiceProxy.svc/GetPracticeReferralTypeLookups?useCache=true&LookupKey=' + lookupKey +'&ProgramId='+PJSON.CEmptyString(programID);
		var html = '<option value="">Select</option>';
		$.ajax({
				url: serviceURL,
				type: "GET",
				contentType: "application/json; charset=utf-8",
				timeout: 30000,
				dataType: "json",
				async: false,
				success: function (data) {
					if (data != null && data != '' && data != '[]') {
						$.each(data, function (name, obj) {
							html += '<option value = \"' + obj.LookupDesc + '\" >' + obj.LookupDesc + '</option>';
						});
						ServiceTypesOptionHtml = html;
					}
				},
				error: function (XMLHttpRequest, textStatus, errorThrown) {
					PEMR_LogInFBC_WCFError('PEMR_GetPracticeLookupDataByLookupKey', XMLHttpRequest, textStatus, errorThrown);
				}
			});
	}
	catch (ex) {
		PEMR_LogInFBC('PEMR_GetPracticeLookupDataByLookupKey', ex.message);
	}
	return ServiceTypesOptionHtml;
}
//Allows only alpha numeric characters, restricting special characters except braces.
function AllowOnlyAlphaNumericals($ctrlid, isalert, divid, errormessage) {
	try {
		//Allow alphanumeric values and "(" ")" braces.
		$('.onlyalphanumerics').on('keypress', function (e) {
			//Validation not required for special keys such as back space, tab ,home,end ,delete ,left and right arrows
			var specialKeys = new Array();
			specialKeys.push(8, 9, 46, 35, 36, 37, 39);
			if (specialKeys.indexOf(e.keyCode) == -1) {
				var regex = new RegExp("^[a-zA-Z0-9-\)\(]*$");
				var keyCode = e.keyCode == 0 ? e.charCode : e.keyCode;
				var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
				if (regex.test(str)) {
					return true;
				}
				e.preventDefault();
				return false;
			}
		}).keydown(function (event) { // Restricting special characters in copy paste except braces.
			setTimeout(function () {
				if (event.ctrlKey == true && event.which == 86) {
				    var str = $ctrlid.val();
				    if (/^[a-zA-Z0-9-\)\(]*$/.test(str) == false) {
				        $ctrlid.val('');
				        if (isalert == true) {
				            alert(errormessage);
				        }
				        else if (divid != '') {
				            $('#' + divid).html(errormessage);
				        }
				    }
				    else {
				        if (divid != '') {
				            $('#' + divid).text('');
				        }
				    }
				}
			}, 10);
		});
	} catch (ex) {
	}
}

//Allow only Numerics with one dot(.)
$('.onlynumerics').keydown(function (event) {
	if (event.shiftKey == true) {
		event.preventDefault();
	}

	if ((event.keyCode >= 48 && event.keyCode <= 57) || (event.keyCode >= 96 && event.keyCode <= 105) || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 37 ||
		event.keyCode == 39 || event.keyCode == 46 || event.keyCode == 190 || event.keyCode == 110) {

	} else {
		event.preventDefault();
	}

	if ($(this).val().indexOf('.') !== -1 && (event.keyCode == 110 || event.keyCode == 190)) {
		event.preventDefault();
	}
});
/*=================[Display Network loss alert]=====================================================================
If user do any operation when loss the Network Connection then displayed Network Connection Loss alert like "Network connection failed. Please check the network connection and try again."
==============================================================================================================================*/
function PEMR_NetworkConnectionAlert() {
	var IsOnline = navigator.onLine;
	if (!IsOnline) {
		alert("Network connection failed. Please check the network connection and try again.");
		return false;
	}
	else {
		return true;
	}
}
//auto increases the textareas height when content is huge, without scroll
$('.auto-textarea').on('keyup blur', function (event) {
	var e = event.type;
	if (e == 'keyup') {
		$(this).css('height', 'auto').height(this.scrollHeight);
	}
	if (e == 'blur') {
		var txtArea = this;
		txtArea.style.cssText = 'height:' + txtArea.scrollHeight + 'px';
	}
});