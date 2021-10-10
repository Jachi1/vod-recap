// Order of events to implement:
// 1. Sanitize input
// 2. Send input to API
// 3. Reformat page with animation and display loading icon until API query finishes
// 4. Store input from API as JSON
// 5. Create and display visualizations

const api_base_url = "https://vod-recap-api.herokuapp.com";


function submit_url() {
    // Fetch input in #search-box DOM element
    url= $("#search-box").val();
    console.log(url);

    // Submit query to API, play loading animation, reformat page to show visualizations
    submit_url_to_api(url).then(
        console.log("Finished fetching results.")        // Replace this with a loading animation
    );

    // TODO: While query is processing, we want to change the main page 
    // so that the search bar is at the top, and a loading icon appears
    // in the middle of the page until the query finishes and visualizations are created.
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
    var data = JSON.parse(JSON.stringify(result));
    console.log(data[0]["message"]);
}

function failure(result) {
    console.log("Failed request");
    console.log(result);
}
