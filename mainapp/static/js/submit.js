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
    url = $("#search-box").val();
    $("#search-contents").css("margin-top", "-2em");
    $(".loader").css("display", "block");

    if (localStorage.getItem(String(url)) !== null) {
        $(".loader").css("display", "none");
        create_visualizations(JSON.parse(localStorage.getItem(String(url))));        
        return;
    }

    // Submit query to API, play loading animation, reformat page to show visualizations
    submit_url_to_api(url).then(
        console.log("Fetching results...")
    );
}

function sanitize_url(url) {
    return
}

function submit_url_to_api(url) {
    return $.ajax({
        url: `${api_base_url}/twitch?url=${url}`,
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
