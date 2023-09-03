
/**
 *  时间戳转换成日期格式
 */
exports.timestampToTime = function timestampToTime(timestamp) {
    // 如果不是int类型，需要先转换
    let tempTime = new Date(Number(timestamp) * 1000);
    return tempTime.toLocaleString();
}
