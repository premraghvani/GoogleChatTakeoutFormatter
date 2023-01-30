// Declaration of Dependencies
const fs = require("fs");

const rawData = JSON.parse(fs.readFileSync("messages.json"));
const groupInfo = JSON.parse(fs.readFileSync("group_info.json"));
let topicOrder = [];
let topics = {};

for(var i = 0; i < rawData.messages.length; i++){
    let ent = rawData.messages[i];
    if(!topics[ent.topic_id]){
        topicOrder.push(ent.topic_id)
        topics[ent.topic_id] = [];
    }
    topics[ent.topic_id].push(extractData(ent));
}

let content = `<html><head><title>Export of ${groupInfo.name}</title></head><body><div style="max-width: 800px;"><h1>Export of ${groupInfo.name}</h1><div id="participants"><h3>Participants as of export:</h3><ul>`
for(var i = 0; i < groupInfo.members.length; i++){
    content+=(`<li>${groupInfo.members[i].name} <a href="mailto:${groupInfo.members[i].email}">(${groupInfo.members[i].email})</a></li>`)
}
content+="</ul></div><div id=\"messages\"><h3>Messages</h3>";
for(var i = 0; i < topicOrder.length; i++){
    content += `<div id="${topicOrder[i]}">`+formatContent(topics[topicOrder[i]])+`</div>`;
}
content += `</div><h3>END OF FILE</h3></div><style>.small{font-size:12px;color:gray;}</style></body>`

fs.writeFileSync("output.html",content)

function extractData(ent){
    let final = {
        head: `${ent.creator.name} (${ent.creator.email}) on ${ent.created_date}`,
        content: "",
        reactions: "",
        files: ""
    }

    if(!!ent.reactions){
        let tmpReactions = [];
        for(var i = 0; i < ent.reactions.length; i++){
            let tmpUsers = ent.reactions[i].reactor_emails;
            tmpReactions.push(`${tmpUsers.join(", ")} reacted with ${ent.reactions[i].emoji.unicode}`)
        }
        final.reactions = tmpReactions.join(", ")
    }

    if(!!ent.annotations && ent.text != undefined){
        let shift = 0;
        let txt = ent.text.split("");
        for(var i = 0; i < ent.annotations.length; i++){
            let q = ent.annotations[i];
            if(!!q.format_metadata){
                if(q.format_metadata.format_type == "HIDDEN"){
                    let lowSide = txt.slice(0,q.start_index-shift-1);
                    let highSide = txt.slice(q.start_index-shift+q.length);
                    txt = lowSide.concat(highSide);
                    shift +- q.length + 1;
                } else if(q.format_metadata.format_type == "BOLD"){
                    let lowSide = txt.slice(0,q.start_index-shift);
                    let formatted = txt.slice(q.start_index-shift,q.start_index-shift+q.length);
                    let highSide = txt.slice(q.start_index-shift+q.length);
                    txt = lowSide.concat([" <b>"]).concat(formatted).concat("</b> ").concat(highSide);
                    shift += 2;
                } else if(q.format_metadata.format_type == "ITALIC"){
                    let lowSide = txt.slice(0,q.start_index-1-shift);
                    let formatted = txt.slice(q.start_index-shift,q.start_index-shift+q.length-1);
                    let highSide = txt.slice(q.start_index-shift+q.length);
                    txt = lowSide.concat([" <i>"]).concat(formatted).concat("</i> ").concat(highSide);
                    shift += 2;
                }
            }
        }
        final.content = txt.join("").replace(/\n/g,"<br>");
    } else {
        if(ent.text != undefined){
            final.content = ent.text.replace(/\n/g,"<br>");
        }
    }

    if(!!ent.attached_files){
        let atx = [];
        for(var i = 0; i < ent.attached_files.length; i++){
            let q = ent.attached_files[i];
            atx.push(`<a href="${q.export_name}">${q.original_name}</a> (file saved as ${q.export_name})`)
        }
        final.files = atx.join(", ");
    }

    if(!final.files){final.files="(None)"}
    if(!final.reactions){final.reactions="(None)"}
    if(!final.content){final.content="<a class=\"small\">No Message Sent</a>"}

    return final;
}

function formatContent(messages){
    if(messages.length == 1){
        let q = messages[0];
        return `<p><b>${q.head}</b><br>${q.content}<br><a class="small">Reactions: ${q.reactions} // Files: ${q.files}</a></p>`;
    } else {
        let q1 = messages[0];
        let final = `<p><b>${q1.head}</b><br>${q1.content}<br><a class="small">Reactions: ${q1.reactions} // Files: ${q1.files}</a></p><blockquote>`;
        for(var i = 1; i < messages.length; i++){
            let q = messages[i];
            final += `<p><b>${q.head}</b><br>${q.content}<br><a class="small">Reactions: ${q.reactions} // Files: ${q.files}</a></p>`
        }
        final += "</blockquote>";
        return final;
    }
}