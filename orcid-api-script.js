$(function() {
	getPassedThroughParams();
	$('#search-value-check').click(function () {
		getOrcidDataByOrcidId();
	});

	$('#search-value-clear').click(function () {
		$('#orcid-table').bootstrapTable('destroy');
		$("#orcid-result-display").prop('checked', false);
		$("#orcid-search-value").val("");
		$("#orcid-results-returned").html("e.g. '1234-5678-9012-3456' or 'Jane Smith'");
	});

	$(document).keypress(function(e) {
		if(e.which == 13) {
			if($("#orcid-search-value").val().length > 0){
				getOrcidDataByOrcidId();
			}
		}
	});
});

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
var authorship;
var url;
function getPassedThroughParams(){
	var fname = getUrlParameter("fname");
	var lname = getUrlParameter("lname");
	authorship = getUrlParameter("authorship");
	url = getUrlParameter("urlExists");
	displayNameInSearchBox(fname, lname);
}

function displayNameInSearchBox(fname, lname){
	if(fname.length > 0 || lname.length > 0){
		var searchContent = "";
		if(fname.length > 0){
			searchContent += fname;
		}
		if(fname.length > 0 && lname.length > 0){
			searchContent += " ";
		}
		if(lname.length > 0){
			searchContent += lname;
		}
		$("#orcid-search-value").val(searchContent);
	}
}

function runningFormatter(value, row, index) {
    return 1+index;
}
function getOrcidDataByOrcidId() {
	$("#orcid-result-display").prop('checked', false);
	$('#orcid-table').bootstrapTable('destroy');
	var searchValue = $("#orcid-search-value").val().trim();
	var rows = 50;
	var query = "";
	console.log("Starting getOrcidDataByOrcidId");
	if (!String.prototype.contains) {
    String.prototype.contains = function(s, i) {
        return this.indexOf(s, i) != -1;
    }
	}	
	String.prototype.addSlashes = function(){
	  //no need to do (str+'') anymore because 'this' can only be a string
  	return this.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
	}
	
	if(searchValue.length == 0){
		$("#orcid-results-returned").html("Please enter a query in the box above");
		return false;
	}	
 	$("#orcid-results-returned").html("Searching for listings please wait...");
 	//do data validation
	if (searchValue.match(/^[a-zA-Z]+/) ) 
	{
		query = searchValue;
	}
	else
	{
		query = "orcid:" + searchValue;	
	} 	
 	console.log("searchValue: " + searchValue);
	console.log("query: " + query);
	
	runSearch(query, "https://pub.orcid.org/v2.0/search?", rows);	
}

function runSearch(person_search, search_url, rows){
	$.ajax({
		dataType: "jsonp",
		contentType : "application/javascript",
		url : search_url,
		data : {
	  		defType: "edismax",
			q : person_search,
			qf: "family-name^50.0 given-and-family-names^50.0 given-names^5.0 credit-name^10.0 other-names^5.0 text^1.0",
			pf: "family-name^50.0",
			rows: rows
		},
		success: function(search_response,status,xhr){
			getUserDetails(search_response, person_search);
		},
		error: function(xhr,status, error){
			console.log(xhr.status + " | " + error + " | " + status);
		}
    });
}

function getUserDetails(search_json, searchValue){
	var searchReturn = [];
	var count = search_json.result.length - 1;
	$.each(search_json.result, function(key){
		var path = search_json.result[key]["orcid-identifier"]["path"];
		$.ajax({
			dataType: "jsonp",
			contentType : "application/javascript",
			url : "https://pub.orcid.org/v2.0/" + path + "/person",
			success: function(data,status,xhr){
				var person = {};	if(JSON.stringify(data["name"]).indexOf("value") >= 0){
					if(JSON.stringify(data["name"]["given-names"]).indexOf("value") >= 0){
						person.fname = data["name"]["given-names"]["value"];
					}else{
						person.fname = "";
					}
					if(JSON.stringify(data["name"]["family-name"]).indexOf("value") >= 0){	
						person.lname = data["name"]["family-name"]["value"];
					}else{
						person.lname = "";
					}
				}else{
					person.fname = "";
					person.lname = "";
				}				
				person.identifier = path;
				if(JSON.stringify(data["researcher-urls"]).indexOf("value") >= 0){				
					person.url = data["researcher-urls"]["researcher-url"][0]["url"]["value"];
				}else{
					person.url = "";
				}
				searchReturn.push(person);
				if(key == count){
        	if(key == 0 && person.fname == "" && person.lname == ""){
  					$("#orcid-results-returned").html("Can't return an orcid id with no name details.  <br/>Please update your ORCID account with your first name and last name.");
          }else{
          	displayTable(searchReturn, searchValue, count + 1);
          }
				} 
			},
			error: function(xhr,status,error){
				console.log(xhr.status + " | " + error + " | " + status);
			}
		});
	});
}

function displayTable(orcidDataReturned, searchValue, resultsCount){
	if (resultsCount <= 0) {
		$("#orcid-results-returned").html("Sorry, no matches found for " + searchValue);
		$("#orcid-result-display").prop('checked', false);
		return false;
	}
	$("#orcid-result-display").prop('checked', true);
	$("#orcid-results-returned").html("Your search for '" + searchValue + "' returned " + resultsCount + " results");
	$('#orcid-table').bootstrapTable({data: orcidDataReturned});  
	getOricdDataFromRows();
	$("#orcid-table tbody").on("DOMSubtreeModified",function(){
		getOricdDataFromRows();
	});
}

function getOricdDataFromRows(){
	$("#orcid-table tbody tr").each(function(){
		$(this).click(function() {
			submitOrcidToSubmission(this);
		});  
	});
}

function checkObject(object_name){
	try{			if(window.opener.document.getElementById(object_name)){
			return true;
		}
	} catch(e){
		console.log(e.name + " : " + e.message);
	}
	return false;
}
function submitOrcidToSubmission(rowData){
	var orcidId = $(rowData).find('td:eq(1)').text();
	var fname = $(rowData).find('td:eq(2)').text();
	var lname = $(rowData).find('td:eq(3)').text();
	var url = $(rowData).find('td:eq(4)').text();
	window.opener.document.getElementById('orcid-user-identifier-' + authorship).value=orcidId;
	window.opener.document.getElementById('orcid-user-fname-' + authorship).value=fname;
	window.opener.document.getElementById('orcid-user-lname-' + authorship).value=lname;
	if(url == "true"){
		window.opener.document.getElementById('orcid-user-url-' + authorship).value=url;		
	}
	window.opener.document.getElementById('orcid-user-identifier-' + authorship).style.display='inline';
	window.close();
}
