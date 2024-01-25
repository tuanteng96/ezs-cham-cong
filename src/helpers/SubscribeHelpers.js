const set = (rt) => new Promise((resolve, reject) => {
    if (localStorage.getItem("_subscribe")) app_request("unsubscribe", "");
    localStorage.setItem("_subscribe", rt);

    var topic = [];
    var Firebase_Prefix = 1;
    topic.push("news-" + Firebase_Prefix + "-" + rt.acc_type); //cho loại M(member) || (U)user
    topic.push("news-" + Firebase_Prefix + "-" + rt.acc_type + "-gr-0"); //Mặc định mọi tài khoản đều thuộc nhóm 0 tương ứng với * trong admin
    topic.push("news-" + Firebase_Prefix + "-" + rt.acc_type + "-id-0"); //Mặc định mọi tài khoản là 0 tương ứng với * trong admin

    (rt.acc_group || "")
    .split(",")
        .filter((x) => {
            return x;
        })
        .forEach((x) => {
            topic.push("news-" + Firebase_Prefix + "-" + rt.acc_type + "-gr-" + x);
        });
    topic.push(
        "news-" + Firebase_Prefix + "-" + rt.acc_type + "-id-" + rt.acc_id
    );

    app_request("subscribe", topic.join(","));
    resolve()
});

const remove = () => new Promise((resolve, reject) => {
    app_request("unsubscribe", "")
    resolve()
});


const SubscribeHelpers = {
    set,
    remove
}

export default SubscribeHelpers;