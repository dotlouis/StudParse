String.prototype.capitalize = function(){
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

DATE_DORT_ASC = function (event1, event2) {
    // This is a comparison function that will result in dates being sorted in
    // ASCENDING order. As you can see, JavaScript's native comparison operators
    // can be used to compare dates. This was news to me.
    if (event1.start > event2.start) return 1;
    if (event1.start < event2.start) return -1;
    return 0;
};

DATE_SORT_DESC = function (event1, event2) {
    // This is a comparison function that will result in dates being sorted in
    // DESCENDING order.
    if (event1.start > event2.start) return -1;
    if (event1.start < event2.start) return 1;
    return 0;
};
