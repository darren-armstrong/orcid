$(function() {
	$(".search_orcid").click(function(){
		var authorship = $(this).parent().children('.orcid-authorship').val();
		var fname = $('#orcid-user-fname-' + authorship).val();
		var lname = $('#orcid-user-lname-' + authorship).val();
		var url = false;
		if($("#orcid-user-url-" + authorship).length){
			url = true;
		}
		window.open('orcid-search.html?authorship=' + 
			authorship +
			'&fname='+ 
			fname +
			'&lname='+
			lname +
			'&urlExists=' +
			url, 'Search_orcid','toolbar=0,status=0,scrollbars=1,resizable=1,width=800,height=450'
		);
	})
});