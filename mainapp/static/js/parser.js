// Will hold individual parsers for certain visualizations.
// Input should be JSON retrieved from API

function create_visualizations(chat_data) {
    // Insert all functions that create visualizations
    emote_messages_per_second_vis(chat_data, 30);
}



function emote_messages_per_second_parse(chat, interval) {
    // Function to parse the chat vod data into the proper format for a particular visualization
    if (!interval) {
        return;
    }

    let current_position = 0;
    var mps = {};
    for (var msg = 0; msg < chat.length; msg++) {
        if (chat[msg]["is_emote"]) {
            tis = parseInt(chat[msg]["time_in_seconds"]);
            let position = Math.floor(tis / interval);
            while (current_position <= position) {
                mps[current_position] = 0;
                current_position++;
            }
            mps[position] = mps[position] + 1;
        }
    }
    return mps;
}

function emote_messages_per_second_vis(chat_data, interval) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = emote_messages_per_second_parse(chat_data, interval);
    
    var vis = new google.visualization.DataTable(); 
    vis.addColumn('string', 'Time (5 second bin)');
    vis.addColumn('number', 'Emote Messages');

    for (let msg = 0; msg < Object.keys(parsed_data).length; msg++) {
        console.log(String(msg), parsed_data[msg]);
        vis.addRow([String(msg), parsed_data[msg]]);
    }

    var options = {
        title: "Number of emote messages per 5 seconds",
        legend: {
            position: "bottom"
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('emote_messages_per_second'));
    chart.draw(vis, options);
}
