// Will hold individual parsers for certain visualizations.
// Input should be JSON retrieved from API

function create_visualizations(chat_data) {
    // Insert all functions that create visualizations
    emote_messages_per_second_vis(chat_data, 30);
    messages_per_second_vis(chat_data, 30);
    emote_or_not_messages_per_second_vis(chat_data, 30);
    sub_messages_per_second_vis(chat_data, 30);
    sub_or_not_messages_per_second_vis(chat_data, 30);
    messages_per_user_vis(chat_data, 10);
    emote_by_usage_vis(chat_data, 10);
    number_of_specific_emotes(chat_data, 30);
    subs_vs_non_sub_chatters(chat_data);
    subscriber_durations(chat_data);

    // Print header-bar to display VOD header information
    if (url.substr(12, 6) == "twitch"){
        document.getElementById("vod-header").innerHTML = 
            "<a href='" + url + "'><img src = \"static/twitch-logo.png\"></a>" +
            "<div id = \"web-title\">Visualizing Twitch VOD Data</div>" + "<br>";
    }
    else if (url.substr(12, 7) == "youtube"){
        document.getElementById("vod-header").innerHTML = 
            "<a href='" + url + "'><img src = \"static/youtube-logo.png\"></a>" + 
            "<div id = \"web-title\">Visualizing Youtube VOD Data</div>" + "<br>";
    }
    // Vod Information
    document.getElementById("vod-header").innerHTML += 
        "<div id = \"vod-info\">" + 
        "Number of Messages: " + chat_data.length + "<br>" +
        "VOD Length: " + chat_data[chat_data.length - 1]["time_stamp_in_vod"] + "<br>" + 
        "</div>";
}

function seconds_to_hours_min_sec(num) {
    let val = parseInt(num);
    var date = new Date(val * 1000).toISOString().substr(11, 8).replace(':', 'h').replace(':', 'm');
    date += 's';
    return date;
}

function create_bins(interval, chat) {
    var bins = {};
    bins[seconds_to_hours_min_sec(0)] = 0;
    let last_timestamp = chat[chat.length-1]["time_in_seconds"];
    let itr = 1;
    let counter = 1;
    while (itr <= last_timestamp + interval) {
        key = interval * counter;
        bins[seconds_to_hours_min_sec(key)] = 0;
        itr += interval;
        counter++;
    }
    return bins;
}

function create_bins_compare(interval, chat) {
    var bins = {};
    bins[seconds_to_hours_min_sec(0)] = [0,0];
    var last_timestamp = chat[chat.length-1]["time_in_seconds"];
    let itr = 1;
    let counter = 1;
    while (itr <= last_timestamp + interval) {
        key = interval * counter;
        key_conv = seconds_to_hours_min_sec(key);
        bins[key_conv] = [0,0];
        itr += interval;
        counter++;
    }
    return bins;
}

function number_of_specific_emotes_parse(chat, interval) {
    if (interval < 1) {
        return;
    }
    
    var emotes = create_bins(interval, chat);

    var next_bin = 1;
    for (var msg = 0; msg < chat.length; msg++) {
        let tis = chat[msg]["time_in_seconds"];
        if (tis < 0) {
            continue;
        }
        if (tis <= (interval * next_bin)) {
            if (chat[msg]["message"].includes("Pog") || chat[msg]["message"].includes("POGGERS") || chat[msg]["message"].includes("LULW") || chat[msg]["message"].includes("LUL") || chat[msg]["message"].includes("OMEGALUL")) { 
                emotes[seconds_to_hours_min_sec(interval * next_bin)]++;
            }
        }
        else {
            next_bin++;
            if (chat[msg]["message"].includes("Pog") || chat[msg]["message"].includes("POGGERS") || chat[msg]["message"].includes("LULW") || chat[msg]["message"].includes("LUL") || chat[msg]["message"].includes("OMEGALUL")) { 
                emotes[seconds_to_hours_min_sec(interval * next_bin)]++;
            }
        }
    }
    return emotes;
}

function number_of_specific_emotes(chat_data, interval) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = number_of_specific_emotes_parse(chat_data, interval);
    var values = $.map(parsed_data, function(value, key) { return value });
    var keys = $.map(parsed_data, function(value, key) { return key });
    var max = 0;
    values.map(d => {
        max = Math.max(max, d)
    });
      
    // reduce height, then make the rest of the visualizations based off of apex charts
    var options = {
        title: {
            text: `Number of Funny Emotes Used per ${interval} Seconds`,
            align: 'center'
        },
        chart: {
            type: 'line',
            height: 'auto',
            events: {
                markerClick: function(event, chartContext, { seriesIndex, dataPointIndex, config}) {
                    let vod_timestamp = `${url}?t=${seconds_to_hours_min_sec(dataPointIndex * interval)}`;
                    window.open(vod_timestamp, '_blank').focus();
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Number of messages',
                data: values
            }
        ],
        stroke: {
            width: 2
        },
        plotOptions: {
            bar: {
                columnWidth: "20%"
            }
        },
        xaxis: {
            categories: keys,
            title: {
                text: "Timestamp in VOD",
                offsetY: -20
            },
            tickAmount: Math.ceil(keys.length / 10)
        },
        yaxis: {
            min: 0,
            max: max + 5,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: "Number of messages sent that contain specified emotes"
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#funny_emotes"), options);
      chart.render();
}


function emote_messages_per_second_parse(chat, interval) {
    // Function to parse the chat vod data into the proper format for a particular visualization
    if (!interval) {
        return;
    }

    var emotes = create_bins(interval, chat);

    var next_bin = 1;
    for (var msg = 0; msg < chat.length; msg++) {
        let tis = chat[msg]["time_in_seconds"];
        if (tis < 0) {
            continue;
        }
        if (tis <= (interval * next_bin)) {
            if (chat[msg]["is_emote"]) { 
                emotes[seconds_to_hours_min_sec(interval * next_bin)]++;
            }
        }
        else {
            next_bin++;
            if (chat[msg]["is_emote"]) { 
                emotes[seconds_to_hours_min_sec(interval * next_bin)]++;
            }
        }
    }
    return emotes;
}

function emote_messages_per_second_vis(chat_data, interval) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = emote_messages_per_second_parse(chat_data, interval);
    var values = $.map(parsed_data, function(value, key) { return value });
    var keys = $.map(parsed_data, function(value, key) { return key });
    var max = 0;
    values.map(d => {
        max = Math.max(max, d)
    });
      
    // reduce height, then make the rest of the visualizations based off of apex charts
    var options = {
        title: {
            text: `Emote Messages per ${interval} Seconds`,
            align: 'center'
        },
        chart: {
            type: 'line',
            height: 'auto',
            events: {
                markerClick: function(event, chartContext, { seriesIndex, dataPointIndex, config}) {
                    let vod_timestamp = `${url}?t=${seconds_to_hours_min_sec(dataPointIndex * interval)}`;
                    window.open(vod_timestamp, '_blank').focus();
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Number of Emote Messages',
                data: values
            }
        ],
        stroke: {
            width: 2
        },
        plotOptions: {
            bar: {
                columnWidth: "20%"
            }
        },
        xaxis: {
            categories: keys,
            title: {
                text: "Timestamp in VOD",
                offsetY: -20
            },
            tickAmount: Math.ceil(keys.length / 10)
        },
        yaxis: {
            min: 0,
            max: max + 5,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: "Number of messages sent that contain emotes"
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#emote_messages_per_second"), options);
      chart.render();
}



function messages_per_second_parse(chat, interval) {
    // Function to parse the chat vod data into the proper format for a particular visualization
    if (!interval) {
        return;
    }

    var messages = create_bins(interval, chat);

    var next_bin = 1;
    for (var msg = 0; msg < chat.length; msg++) {
        let tis = chat[msg]["time_in_seconds"];
        if (tis < 0) {
            continue;
        }
        if (tis <= (interval * next_bin)) {
            messages[seconds_to_hours_min_sec(interval * next_bin)]++;
        }
        else {
            next_bin++;
            messages[seconds_to_hours_min_sec(interval * next_bin)]++;
        }
    }
    return messages;
}

function messages_per_second_vis(chat_data, interval) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = messages_per_second_parse(chat_data, interval);
    var values = $.map(parsed_data, function(value, key) { return value });
    var keys = $.map(parsed_data, function(value, key) { return key });
    var max = 0;
    values.map(d => {
        max = Math.max(max, d)
    });
      
    // reduce height, then make the rest of the visualizations based off of apex charts
    var options = {
        title: {
            text: `Messages per ${interval} Seconds`,
            align: 'center'
        },
        chart: {
            type: 'line',
            height: 'auto',
            events: {
                markerClick: function(event, chartContext, { seriesIndex, dataPointIndex, config}) {
                    let vod_timestamp = `${url}?t=${seconds_to_hours_min_sec(dataPointIndex * interval)}`;
                    window.open(vod_timestamp, '_blank').focus();
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Number of Messages',
                data: values
            }
        ],
        stroke: {
            width: 2
        },
        plotOptions: {
            bar: {
                columnWidth: "20%"
            }
        },
        xaxis: {
            categories: keys,
            title: {
                text: "Timestamp in VOD",
                offsetY: -20
            },
            tickAmount: Math.ceil(keys.length / 10)
        },
        yaxis: {
            min: 0,
            max: max + 5,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: "Number of messages sent"
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#messages_per_second"), options);
      chart.render();
}


function emote_or_not_messages_per_second_parse(chat, interval) {
    if (!interval) {
        return;
    }

    var bins = create_bins_compare(interval, chat);

    var next_bin = 1;
    for (var msg = 0; msg < chat.length; msg++) {
        let tis = chat[msg]["time_in_seconds"];
        if (tis < 0) {
            continue;
        }
        if (tis <= (interval * next_bin)) {
            let bin = seconds_to_hours_min_sec(interval * next_bin);
            if (chat[msg]["is_emote"]) { 
                bins[bin][1]++;
            } else {
                bins[bin][0]++;
            }
        }
        else {
            next_bin++;
            let bin = seconds_to_hours_min_sec(interval * next_bin);
            if (chat[msg]["is_emote"]) { 
                bins[bin][1]++;
            } else {
                bins[bin][0]++;
            }
        }
    }
    return bins;
}

function emote_or_not_messages_per_second_vis(chat_data, interval) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = emote_or_not_messages_per_second_parse(chat_data, interval);
    var emote_values = $.map(parsed_data, function(value, key) { return value[1] });
    var msg_values = $.map(parsed_data, function(value, key) { return value[0] });
    var keys = $.map(parsed_data, function(value, key) { return key });
    
    var emote_max = 0;
    var msg_max = 0;
    var max = 0;
    emote_values.map(d => {
        emote_max = Math.max(emote_max, d)
    });
    msg_values.map(d => {
        msg_max = Math.max(msg_max, d)
    });
    max = Math.max(emote_max, msg_max);
    
    // reduce height, then make the rest of the visualizations based off of apex charts
    var options = {
        title: {
            text: `Emotes Vs. Messages per ${interval} Seconds`,
            align: 'center'
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            onItemClick: {
                toggleDataSeries: true
            },
            onItemHover: {
                highlightDataSeries: true
            }
        },
        chart: {
            type: 'line',
            height: 'auto',
            events: {
                markerClick: function(event, chartContext, { seriesIndex, dataPointIndex, config}) {
                    let vod_timestamp = `${url}?t=${seconds_to_hours_min_sec(dataPointIndex * interval)}`;
                    window.open(vod_timestamp, '_blank').focus();
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Number of Messages',
                data: msg_values
            },
            {
                name: 'Number of Emote Messages',
                data: emote_values
            }
        ],
        stroke: {
            width: 2
        },
        plotOptions: {
            bar: {
                columnWidth: "20%"
            }
        },
        xaxis: {
            categories: keys,
            title: {
                text: "Timestamp in VOD",
                offsetY: -20
            },
            tickAmount: Math.ceil(keys.length / 10)
        },
        yaxis: {
            min: 0,
            max: max + 5,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: "Number of messages sent"
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#emote_or_not_messages_per_second"), options);
      chart.render();
}



function sub_messages_per_second_parse(chat, interval) {
    // Function to parse the chat vod data into the proper format for a particular visualization
    if (!interval) {
        return;
    }

    var sub_msgs = create_bins(interval, chat);

    var next_bin = 1;
    for (var msg = 0; msg < chat.length; msg++) {
        let tis = chat[msg]["time_in_seconds"];
        if (tis < 0) {
            continue;
        }
        if (tis <= (interval * next_bin)) {
            if (chat[msg]["subscriber"]) { 
                sub_msgs[seconds_to_hours_min_sec(interval * next_bin)]++;
            }
        }
        else {
            next_bin++;
            if (chat[msg]["subscriber"]) { 
                sub_msgs[seconds_to_hours_min_sec(interval * next_bin)]++;
            }
        }
    }
    return sub_msgs;
}

function sub_messages_per_second_vis(chat_data, interval) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = sub_messages_per_second_parse(chat_data, interval);
    var values = $.map(parsed_data, function(value, key) { return value });
    var keys = $.map(parsed_data, function(value, key) { return key });
    var max = 0;
    values.map(d => {
        max = Math.max(max, d)
    });
      
    // reduce height, then make the rest of the visualizations based off of apex charts
    var options = {
        title: {
            text: `Subscriber Messages per ${interval} Seconds`,
            align: 'center'
        },
        chart: {
            type: 'line',
            height: 'auto',
            events: {
                markerClick: function(event, chartContext, { seriesIndex, dataPointIndex, config}) {
                    let vod_timestamp = `${url}?t=${seconds_to_hours_min_sec(dataPointIndex * interval)}`;
                    window.open(vod_timestamp, '_blank').focus();
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Number of Messages',
                data: values
            }
        ],
        stroke: {
            width: 2
        },
        plotOptions: {
            bar: {
                columnWidth: "20%"
            }
        },
        xaxis: {
            categories: keys,
            title: {
                text: "Timestamp in VOD",
                offsetY: -20
            },
            tickAmount: Math.ceil(values.length / 10)
        },
        yaxis: {
            min: 0,
            max: max + 5,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: "Number of messages sent"
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#sub_messages_per_second"), options);
      chart.render();
}


function sub_or_not_messages_per_second_parse(chat, interval) {
    if (!interval) {
        return;
    }

    var bins = create_bins_compare(interval, chat);

    var next_bin = 1;
    for (var msg = 0; msg < chat.length; msg++) {
        let tis = chat[msg]["time_in_seconds"];
        if (tis < 0) {
            continue;
        }
        if (tis <= (interval * next_bin)) {
            let bin = seconds_to_hours_min_sec(interval * next_bin);
            if (chat[msg]["subscriber"]) { 
                bins[bin][1]++;
            } else {
                bins[bin][0]++;
            }
        }
        else {
            next_bin++;
            let bin = seconds_to_hours_min_sec(interval * next_bin);
            if (chat[msg]["subscriber"]) { 
                bins[bin][1]++;
            } else {
                bins[bin][0]++;
            }
        }
    }
    return bins;
}

function sub_or_not_messages_per_second_vis(chat_data, interval) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = sub_or_not_messages_per_second_parse(chat_data, interval);
    var sub_values = $.map(parsed_data, function(value, key) { return value[1] });
    var non_sub_values = $.map(parsed_data, function(value, key) { return value[0] });
    var keys = $.map(parsed_data, function(value, key) { return key });
    
    var sub_max = 0;
    var non_sub_max = 0;
    var max = 0;
    sub_values.map(d => {
        sub_max = Math.max(sub_max, d)
    });
    non_sub_values.map(d => {
        non_sub_max = Math.max(non_sub_max, d)
    });
    max = Math.max(sub_max, non_sub_max);
      
    // reduce height, then make the rest of the visualizations based off of apex charts
    var options = {
        title: {
            text: `Subscriber Vs. Non-subscriber Messages per ${interval} Seconds`,
            align: 'center'
        },
        legend: {
            show: true,
            position: 'top',
            horizontalAlign: 'right',
            onItemClick: {
                toggleDataSeries: true
            },
            onItemHover: {
                highlightDataSeries: true
            }
        },
        chart: {
            type: 'line',
            height: 'auto',
            events: {
                markerClick: function(event, chartContext, { seriesIndex, dataPointIndex, config}) {
                    let vod_timestamp = `${url}?t=${seconds_to_hours_min_sec(dataPointIndex * interval)}`;
                    window.open(vod_timestamp, '_blank').focus();
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Number of Non-Subscriber Messages',
                data: non_sub_values
            },
            {
                name: 'Number of Subscriber Messages',
                data: sub_values
            }
        ],
        stroke: {
            width: 2
        },
        plotOptions: {
            bar: {
                columnWidth: "20%"
            }
        },
        xaxis: {
            categories: keys,
            title: {
                text: "Timestamp in VOD",
                offsetY: -20
            },
            tickAmount: Math.ceil(keys.length / 10)
        },
        yaxis: {
            min: 0,
            max: max + 5,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: "Number of messages sent"
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#sub_or_not_messages_per_second"), options);
      chart.render();
}



function messages_per_user_parse(chat) {
    // Function to parse the chat vod data into the proper format for a particular visualization
    var mpu = {};
    for (var msg = 0; msg < chat.length; msg++) {
        let author = chat[msg]["author"];
        if (author in mpu){
            mpu[author]++;
        }
        else {
            mpu[author] = 1;
        }
    }
    return mpu;
}

function messages_per_user_vis(chat_data, num_users) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = messages_per_user_parse(chat_data);
    var keys = $.map(parsed_data, function(value, key) { return key });
    
    var sorted_data = Object.keys(parsed_data).map(function(key) {
        return [key, parsed_data[key]];
    });
    sorted_data.sort(function(first, second) {
        return second[1] - first[1];
    });
    
    // Check that user submitted number does not exceed max number of chatters
    if (num_users > keys.length || num_users < 1) {
        num_users = keys.length;
    }

    var highest_chatters = [];
    var chatters_values = [];
    for (let i = 0; i < num_users; i++) {
        highest_chatters.push(sorted_data[i][0]);
        chatters_values.push(sorted_data[i][1]);
    }

    var options = {
        title: {
            text: `Most Active Chatters`,
            align: 'center'
        },
        chart: {
            type: 'bar',
            height: 'auto',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Users',
                data: chatters_values
            }
        ],
        stroke: {
            width: 2
        },
        fill: {
            type: 'gradient'
        },
        plotOptions: {
            bar: {
                columnWidth: "20%",
                horizontal: true
            }
        },
        xaxis: {
            categories: highest_chatters,
            title: {
                text: "Number of Messages Sent"
            }
        },
        yaxis: {
            min: 0,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: `Top ${num_users} Most Active Users`
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#messages_per_user"), options);
      chart.render();
}



function emote_by_usage_parse(chat) {
    // Function to parse the chat vod data into the proper format
    var ebu = {};
    for (var msg = 0; msg < chat.length; msg++) {
        if (chat[msg]["emotes"].length > 0) {
            for (var emote = 0; emote < chat[msg]["emotes"].length; emote++){
                let curr_emote = chat[msg]["emotes"][emote];
                if (curr_emote in ebu){
                    ebu[curr_emote]++;
                }
                else{
                    ebu[curr_emote] = 1;
                }
            }
        }
    }
    return ebu;
}

function emote_by_usage_vis(chat_data, num_emotes) {
    // Function to create the visualization, and insert the visualization into its respective <div>
    var parsed_data = emote_by_usage_parse(chat_data);
    var keys = $.map(parsed_data, function(value, key) { return key });
    
    var sorted_data = Object.keys(parsed_data).map(function(key) {
        return [key, parsed_data[key]];
    });
    sorted_data.sort(function(first, second) {
        return second[1] - first[1];
    });
    
    // Check that user submitted number does not exceed max number of emotes
    if (num_emotes > keys.length || num_emotes < 1) {
        num_emotes = keys.length;
    }

    var highest_emotes = [];
    var emote_names = [];
    for (let i = 0; i < num_emotes; i++) {
        highest_emotes.push(sorted_data[i][0]);
        emote_names.push(sorted_data[i][1]);
    }

    var options = {
        title: {
            text: `Top ${num_emotes} Most Used Emotes`,
            align: 'center'
        },
        chart: {
            type: 'bar',
            height: 'auto',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [
            {
                name: 'Emotes',
                data: emote_names
            }
        ],
        stroke: {
            width: 2
        },
        fill: {
            type: 'gradient'
        },
        plotOptions: {
            bar: {
                columnWidth: "20%",
                horizontal: true
            }
        },
        xaxis: {
            categories: highest_emotes,
            title: {
                text: "Number of Messages Sent Containing Emote"
            }
        },
        yaxis: {
            min: 0,
            axisBorder: {
                show: true
            },
            axisTicks: {
                show: true
            },
            title: {
                text: `Top ${num_emotes} Most Used Emotes`
            }
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#emote_by_usage"), options);
      chart.render();
}

function get_number_of_subscriber_chatters(chat) {
    var num_subs = 0
    var num_non_subs = 0;
    var users = [];

    for (var msg = 0; msg < chat.length; msg++) {
        if (chat[msg]["subscriber"]) {
            if (!(chat[msg]["author"] in users)) {
                num_subs++;
                users.push(chat[msg]["author"]);
            }
        } else {
            num_non_subs++;
        }
    }
    return {'num_sub_chatters': num_subs, 'num_non_sub_chatters': num_non_subs};
}

function subs_vs_non_sub_chatters(chat) {
    var data = get_number_of_subscriber_chatters(chat);

    var options = {
        title: {
            text: `Number of Subscribed Chatters Vs. Not-subscribed Chatters`,
            align: 'center'
        },
        chart: {
            type: 'pie',
            height: '250',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: [data.num_sub_chatters, data.num_non_sub_chatters],
        labels: ['Subscribed Chatters', 'Non-subscribed Chatters'],
        fill: {
            type: 'gradient'
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#num_sub_vs_not_sub"), options);
      chart.render();
}


function get_subscriber_durations(chat) {
    var subscription_durations = {};

    for (var msg = 0; msg < chat.length; msg++) {
        subscription_durations[chat[msg]["subscription_duration"]] = 0
    }

    for (var msg = 0; msg < chat.length; msg++) {
        subscription_durations[chat[msg]["subscription_duration"]]++;
    }

    return subscription_durations;
}

function subscriber_durations(chat) {
    var data = get_subscriber_durations(chat);
    var values = $.map(data, function(value, key) { return value });
    var keys = $.map(data, function(value, key) { return key });

    var options = {
        title: {
            text: `Subscription Durations`,
            align: 'center'
        },
        chart: {
            type: 'pie',
            height: '250',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                }
            },
            redrawOnWindowResize: true,
            background: '#343a40',
            foreColor: '#fff'
        },
        series: values,
        labels: keys,
        fill: {
            type: 'gradient'
        },
        tooltip: {
            enabled: true
        }
      }
      
      var chart = new ApexCharts(document.querySelector("#subscriber_durations"), options);
      chart.render();
}