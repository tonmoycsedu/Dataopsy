class Viz {
    /* CONSTRUCTOR */
    constructor(id, data, index, value_column) {
        this.id = id
        this.cards = {}
        this.cards['main'] = new Card("Main View", "main", "viz_parent", data, index, value_column)

        this.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        this.nonAllowedChars = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '+', '=', '{', '}', '[', ']', '|', '\\', ';', ':', '\'', '\"', '<', '>', ',', '.', '/', '?'];
        this.regex = new RegExp(`[${this.nonAllowedChars.join('\\')}]`, 'g');
        
    }
    add_new_card(name, parent_div, data, index, value_column) {
        this.cards[name] = new Card("Substrate: "+name.substring(1, name.length - 1), this.validate_id(name),
         parent_div, data, index, value_column)
    }
    validate_id(id){
        // replace any non-allowed characters with '_'
        id = id.replace(this.regex, '_');
        return id
    }
}