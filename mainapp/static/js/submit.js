// Order of events to implement:
// 1. Sanitize input
// 2. Send input to API
// 3. Reformat page with animation and display loading icon until API query finishes
// 4. Store input from API as JSON
// 5. Create and display visualizations

const api_base_url = "https://vod-recap-api.ue.r.appspot.com";
var data = {};
var url;

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(empty);

function empty() {
    return;
}


function submit_url() {

    // Fetch input in #search-box DOM element
    let val = $("#search-box").val();
    url = sanitize_string(val).trim();
    $("#search-contents").css("margin-top", "-2em");
    $(".loader").css("display", "block");

    if (localStorage.getItem(String(url)) !== null) {
        $(".loader").css("display", "none");
        create_visualizations(JSON.parse(localStorage.getItem(String(url))));        
        return;
    }

    // Submit query to API, play loading animation, reformat page to show visualizations
    let domain = get_domain(url);
    if (domain < 0) {
        alert("The VOD URL must belong to Twitch or YouTube.");
        return;
    }

    submit_url_to_api(domain, url).then(
        console.log("Fetching results...")
    );
}

function sanitize_string(string) {
    return string.replace(/[*+^${}()|[\]\\]/g, '\\$&');
}

function get_domain(string) {
    let domain = '';
    try {
        domain = (new URL(string));
        domain = domain.hostname.replace('www.', '').replace('.com', '').replace('.tv', '');
    } catch (error) {
        $(".loader").css("display", "none");
        return -1;
    }
    
    switch(domain) {
        case "twitch":
            return "twitch";
        case "youtube":
            return "youtube";
        default:
            return -1;
    }
}

function submit_url_to_api(domain, url) {
    return $.ajax({
        url: `${api_base_url}/${domain}?url=${url}`,
        type: "GET",
        dataType: 'json',
        success: get_results,
        error: failure,
    });
}

function get_results(result, status, xhr) {
    data = JSON.parse(JSON.stringify(result));
    if (data.hasOwnProperty("err")) {
        alert(data["err"]);
        $(".loader").css("display", "none");
        $("#search-contents").css("margin-top", "5em");
        return;
    }

    localStorage.setItem(url, JSON.stringify(data));
    $(".loader").css("display", "none");                    // Remove spinner, then fill out visualization divs
    create_visualizations(data);                            // Function will create all the other visualizations

}

function failure(result) {
    console.log("Failed request");
    console.log(result);
}

// For window resize events   
$(window).resize(function() {
    if(this.resizeTO) clearTimeout(this.resizeTO);
    this.resizeTO = setTimeout(function() {
        $(this).trigger('resizeEnd');
    }, 500);
});
  
$(window).on('resizeEnd', function() {
    create_visualizations(JSON.parse(localStorage.getItem(String(url))));
});