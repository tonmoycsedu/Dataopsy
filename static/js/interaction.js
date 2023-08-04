class Interaction {
    /* CONSTRUCTOR */
    constructor() {
    }
    install_events(){
        var self = this;

        self.svg['g'].selectAll(".chart_label").on("mouseover", (e, d) => {
            // highlight the selected label. need to highlight children also
            d3.select(e.currentTarget).style("fill", "orange")
    
            //get the query value
            if($(e.currentTarget).hasClass("x"))
                var cols = self.DATA.x_columns
            else
                var cols = self.DATA.y_columns
            var sel = self.get_selected_tuple(d, cols, {})
    
            // highlight the points (circles)
            self.svg['g'].selectAll(".point").filter(function(d) { 
                var match = 1
                for(var k in sel){
                    if (d[k] != sel[k])
                        match  = 0
                }
                return match
            }).style("stroke", "orange").style("stroke-width", 2);
        })
        self.svg['g'].selectAll(".chart_label").on("mouseout", (e, d) => {
    
            // check if the item is clicked or not 
            if(!$(e.currentTarget).hasClass("selected")){
    
                // dehighlight
                d3.select(e.currentTarget).style("fill", "black")
    
                //get the query value
                if($(e.currentTarget).hasClass("x"))
                    var cols = self.DATA.x_columns
                else
                    var cols = self.DATA.y_columns
                var sel = self.get_selected_tuple(d, cols, {})
    
                // dehighlight the points
                self.svg['g'].selectAll(".point").filter(function(d) { 
                    var match = 1
                    for(var k in sel){
                        if (d[k] != sel[k])
                            match  = 0
                    }
                    return match
                }).style("stroke", "grey").style("stroke-width", 1);
            }
        })
    
        self.svg['g'].selectAll(".chart_label").on("click", (e, d) => {
            // get the query
            if($(e.currentTarget).hasClass("x"))
                var cols = self.DATA.x_columns
            else
                var cols = self.DATA.y_columns
    
            var sel = self.get_selected_tuple(d, cols, {})
            console.log(sel, d)
    
            // check if the label is already selected or not
            if($(e.currentTarget).hasClass("selected")){
                $(e.currentTarget).removeClass("selected")
                self.svg['g'].selectAll(".point").filter(function(d) { 
                    var match = 1
                    for(var k in sel){
                        if (d[k] != sel[k])
                            match  = 0
                    }
                    return match
                }).attr("class", "point")
    
                self.DATA.selected_tuples = self.removeObject(self.DATA.selected_tuples, sel)
            }
            else{
                $(e.currentTarget).addClass("selected")
                d3.selectAll(".point").filter(function(d) { 
                    var match = 1
                    for(var k in sel){
                        if (d[k] != sel[k])
                            match  = 0
                    }
                    return match
                }).attr("class", "point selected")
                self.DATA.selected_tuples.push(sel)
    
                // if 
                if(self.DATA.selected_tuples.length){
                    $("#"+self.prune_id).removeClass("disabled")
                    $("#"+self.substrate_id).removeClass("disabled")
                    $("#"+self.pile_id).removeClass("disabled")
                }
                else{
                    $("#"+self.prune_id).addClass("disabled")
                    $("#"+self.substrate_id).addClass("disabled")
                    $("#"+self.pile_id).removeClass("disabled")
                }
    
                var res = self.DATA.create_pruned_dataset([sel], self.DATA.data)
    
                $("#interaction").append('<a class="item"><div class="ui mini brown label">Selected</div>'+
                '<div class="ui mini label">'+res.count+ ' items<i class="delete icon"></i></div></a>')
            }
        })
    
        self.svg['g'].selectAll(".point").on("mouseover", function(e, d){
            // console.log(d)
            d3.select(this)
            .style("stroke-width", 2)
            .style("stroke", "orange")
    
            VIZ.tooltip.transition()
                .duration(200)
                .style("opacity", .9);
    
            VIZ.tooltip.html(d[self.DATA.value_column])
                .style("left", (e.pageX) + "px")
                .style("top", (e.pageY - 40) + "px");

            self.highlight_axis_labels(d)
        })
        self.svg['g'].selectAll(".point").on("mouseout", function(e, d){
            if(!$(e.currentTarget).hasClass("selected")){
                d3.select(this)
                .style("stroke-width", 1)
                .style("stroke", "grey")
            } 
            VIZ.tooltip.transition()
                .duration(200)
                .style("opacity", 0);

            self.svg['g'].selectAll(".chart_label").style("fill", "black");
        });
    
        self.svg['g'].selectAll(".point").on("click", function(e, d){
            let sel = JSON.parse(JSON.stringify(d));
            delete sel[self.DATA.value_column]
    
            if(!$(e.currentTarget).hasClass("selected")){
                $(e.currentTarget).addClass("selected")
                self.DATA.selected_tuples.push(sel)
    
                if(self.DATA.selected_tuples.length){
                    $("#"+self.prune_id).removeClass("disabled")
                    $("#"+self.substrate_id).removeClass("disabled")
                }
                else{
                    $("#"+self.prune_id).addClass("disabled")
                    $("#"+self.substrate_id).addClass("disabled")
                }
                
                var res = self.DATA.create_pruned_dataset([sel], self.DATA.data)
                $("#interaction").append('<a class="item"><div class="ui mini brown label">Selected</div>'+
                    '<div class="ui mini label">'+res.count+ ' items<i class="delete icon"></i></div></a>')
            }
            else{
                $(e.currentTarget).removeClass("selected")
                self.DATA.selected_tuples = self.removeObject(self.DATA.selected_tuples, sel)
            }
        })  
    }
    get_selected_tuple(d, attr_list, tuple = {}){
        var self = this;
        if (!d.parent)
            return
    
        tuple[attr_list[d.depth - 1]] = d.data[0]
        self.get_selected_tuple(d.parent, attr_list, tuple)
        return tuple   
    }
    removeObject(arr, o) {
        const objWithIdIndex = arr.findIndex((obj) => JSON.stringify(obj) === JSON.stringify(o));
        console.log(objWithIdIndex)
        if (objWithIdIndex > -1) {
          arr.splice(objWithIdIndex, 1);
        }
        return arr;
    }
    iterative_filterting(objs, v){

        objs.filter(c =>  c.data[0] == v)
                .style("fill", "orange");
        
        return objs.filter(c => {
            if(c.parent){
                if(c.parent.data[0] == v)
                    return true
            }
            return false    
        })

    }
    highlight_axis_labels(d){
        var self = this;
        if(self.DATA.x_columns.length){
            var vals = []
            self.DATA.x_columns.forEach(x => vals.push(d[x]))
            var sels = self.svg['g'].selectAll('.chart_label.x')
            vals.forEach(v => {
                sels = self.iterative_filterting(sels , v)
            })        
        }
        if(self.DATA.y_columns.length){
            var vals = []
            self.DATA.y_columns.forEach(x => vals.push(d[x]))
            var sels = self.svg['g'].selectAll('.chart_label.y')
            vals.forEach(v => {
                sels = self.iterative_filterting(sels , v)
            })   
        }
    }
}

