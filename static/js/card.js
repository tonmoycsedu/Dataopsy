class Card extends Interaction{

    /* CONSTRUCTOR */
    constructor(title, div_id, parent_id, data, index, value_column) {
        super()
        this.title = title;
        this.div_id = div_id;
        this.parent_id = parent_id;
        this.svg = {}
        this.format = d3.format(".2s")
        this.DATA = new Data(data, index, value_column);
        this.saved_data = {}

        this.svg.id =  this.div_id +'_svg'
        this.header_id = this.div_id +'_header'
        this.x_axis_id = this.div_id + '_x-axis'
        this.y_axis_id = this.div_id + '_y-axis'
        this.peek_id = this.div_id + '_peek'
        this.prune_id = this.div_id + '_prune'
        this.substrate_id = this.div_id + '_substrate'
        this.pile_id = this.div_id + '_pile'
        this.export_id = this.div_id + '_export'
        this.log_id = this.div_id + '_log'
        this.pile_modal = this.div_id + '_pilemodal'
        this.pile_name = this.div_id + '_pilename'
        this.pile_confirm = this.div_id + '_pileconfirm'
        this.histbar_class = this.div_id + '_histbar'
        this.prune_num = 0
        this.substrate_num = 0

        this.create_card()

        $("#"+ this.header_id).append(this.Histogram(data, {
            value: d => d[value_column],
            yLabel: "↑ "+ value_column,
            label: "Bin",
            width: 200,
            height: 50,
            color: "steelblue",
            thresholds: 50,
            cls: this.histbar_class
        }))

        this.install_headers()
        this.DATA.pivot()
        this.redraw()
        $('.ui.accordion')
            .accordion();
        this.save_state('initial_commit')
        $("#"+this.log_id + ">"+".menu").append('<div class="item log" data-value="initial_commit">'+
                '<div class="ui mini label">Initial State</div></div>')
    }

    // create te skeleton of the card
    create_card(){
        var self = this;
        
        //add the accordion/card
        var html_string = '<div class="ui fluid card">' +
            '<div class="ui grid content" style="padding:0px">' +
                '<div class="ten wide column" style="padding:2px">'+
                    '<div id="'+self.x_axis_id+'" class="ui icon mini compact button teal dropdown" data-tooltip="Pivot x-axis">'+
                        '<i class="table icon"></i>'+
                        '<div class="menu"></div>'+
                    '</div>'+
                    '<div id="'+self.y_axis_id+'" class="ui icon mini compact button purple dropdown" data-tooltip="Pivot y-axis">'+
                        '<i class="table icon"></i>'+
                        '<div class="menu"></div>'+
                    '</div>'+
                    '<div id="'+self.peek_id+'" class="ui icon button compact violet mini dropdown" data-tooltip="Peek">'+
                        '<i class="eye icon"></i>'+
                        '<div class="menu"></div>'+
                    '</div>'+
                    '<button id="'+self.prune_id+'" class="ui icon button red compact mini disabled" data-tooltip="Prune"><i class="cut icon"></i></button>'+
                    '<button id="'+self.substrate_id+'" class="ui icon button blue compact mini disabled" data-tooltip="Projection"><i class="lightbulb icon"></i></button>'+
                    '<button id="'+self.pile_id+'" class="ui icon button pink compact mini disabled" data-tooltip="Pile"><i class="align justify icon"></i></button>'+
                    '<button id="'+self.export_id+'" class="ui icon button compact mini" data-tooltip="Export data"><i class="file icon"></i></button>'+
                    '<div id="'+self.log_id+'" class="ui icon button compact mini dropdown" data-tooltip="Interaction Log">'+
                        '<i class="redo icon"></i>'+
                        '<div class="menu"></div>'+
                    '</div>'+
                '</div>'+
                '<div class="three wide column" id ="'+self.header_id+'" style="padding:2px"> </div>'+
                '<div class="two wide column">'+
			        '<label># bins</label>'+
			        '<input type="number" min="1" max="100" step="10" value="50" id="nBin"></input>'+
                '</div>'+
                '<div class="one wide column">'+   
                    '<i class="window close outline icon"></i>'+
                '</div>'+
            '</div>'+
            '<div id="'+self.div_id+'" class="ui fluid styled accordion" style="overflow: visible">' +
                '<div class="active title">'+
                    '<i class="dropdown icon"></i>'+
                    self.title +
                '</div>'+
                '<div id="'+self.svg.id+'" class="active content">' +
                '</div>'+
            '</div>'+
            '<div id="'+self.pile_modal+'" class="ui modal">'+
                '<div class="content">'+
                    '<div class="ui input"><input id="'+self.pile_name+'" type="text" placeholder="enter category name"></input></div>'+  
                    '<button id="'+self.pile_confirm+'" class="ui mini button blue">Pile Categories</button>'+ 
                '</div>'+   
            '</div>'+
        '</div>';

        $('#' + self.parent_id).append(html_string)

        self.svg.margin = {top: 10, right: 20, bottom: 20, left: 40}
        self.svg.width = $("#"+self.parent_id).width() - self.svg.margin.left - self.svg.margin.right;
        self.svg.height = 600 - self.svg.margin.top - self.svg.margin.bottom;

        //append svg
        self.svg.g = d3.select("#"+self.svg.id)
            .append("svg")
            .attr("width", self.svg.width + self.svg.margin.left + self.svg.margin.right)
            .attr("height", self.svg.height + self.svg.margin.top + self.svg.margin.bottom)
            .append("g")
            .style("font", "20px times")
            .attr("transform",
            "translate(" + self.svg.margin.left + "," + self.svg.margin.top + ")");

        self.x_domain = []
        self.y_domain = []
        self.x_range = []
        self.y_range = []

        self.r = d3.scaleLinear()
            .range([ 5, 30]);

        // Build color scale
        self.color = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)

    }

    // redraw the viz
    redraw(){

        var self = this;
        $("#"+self.svg.id).empty();
        const nodes_y = self.DATA.y_hierarchy.descendants().filter(d => d.children);
        const nodes_x = self.DATA.x_hierarchy.descendants().filter(d => d.children);
        self.x_depth = 60
        self.y_depth = 100
        if(nodes_x.length < 50){
            self.svg.width = $("#"+self.parent_id).width() - self.svg.margin.left - self.svg.margin.right
            self.nodeSize_x1 = Math.floor((self.svg.width - self.y_depth)/nodes_x.length)
            self.nodeSize_x2 = 20
        }
        else{
            self.nodeSize_x1 = 20
            self.nodeSize_x2 = 20
            self.svg.width = (nodes_x.length + 1) * self.nodeSize_x1 + self.y_depth
        }

        if(nodes_y.length < 50){
            self.svg.height = 600 - self.svg.margin.top - self.svg.margin.bottom;
            self.nodeSize_y1 = Math.floor((self.svg.height - self.x_depth)/nodes_y.length)
            self.nodeSize_y2 = 20
        }
        else{
            self.nodeSize_y1 = 12
            self.nodeSize_y2 = 12
            self.svg.height = (nodes_y.length + 1) * self.nodeSize_y1 + self.x_depth
        }
        
        self.svg.g = d3.select("#"+self.svg.id)
          .append("svg")
          .attr("width", self.svg.width + self.svg.margin.left + self.svg.margin.right)
          .attr("height", self.svg.height + self.svg.margin.top + self.svg.margin.bottom)
          .append("g")
          .style("font", "20px times")
          .attr("transform",
            "translate(" + self.svg.margin.left + "," + self.svg.margin.top + ")");

        var labels = Label_x(self.DATA.x_hierarchy, self.svg, self.DATA.x_columns, {nodeSize_x1: self.nodeSize_x1, nodeSize_x2: self.nodeSize_x2, 
            offset: self.y_depth})
        self.x_domain = labels.domain
        self.x_range = labels.range

        labels = Label_y(self.DATA.y_hierarchy, self.svg, self.DATA.y_columns, {nodeSize_y1: self.nodeSize_y1, nodeSize_y2: self.nodeSize_y2, 
            offset: self.x_depth})
        self.y_domain = labels.domain
        self.y_range = labels.range

        self.visualize()
    }
    
    // main 2D flat viz
    visualize() {
        var self = this;

        console.log("drawing!!")

        // self.r.domain([0, d3.max(DATA.rolld, d => d[DATA.value_column])])
        self.color.domain([0, d3.max(self.DATA.rolld, d => d[self.DATA.value_column])])
        var r = d3.min([80, self.nodeSize_x1/2 - 1, self.nodeSize_y1/2 - 1])

        // create the horizontal and vertical lines
        self.svg['g'].append("g")
        .selectAll("path")
        .data(self.x_range)
        .enter()
        .append("path")
        .attr("stroke-width", 0.2)
        .attr("stroke", "lightgrey")
        .attr("d", d => "M" + d[0] + 
            ","+ (d[1]+10)  + "L "+ d[0]  + ", "+ self.svg['height'])

        self.svg['g'].append("g")
        .selectAll("path")
        .data(self.y_range)
        .enter()
        .append("path")
        .attr("stroke-width", 0.2)
        .attr("stroke", "lightgrey")
        .attr("d", d => "M " + (d[0]+10) + ", " + d[1]+
            "L "+ self.svg['width'] +", "+ d[1])

        self.dot = self.svg['g']
            .selectAll("dot")
            .data(self.DATA.rolld)
            .enter()
            .append("g")
            .attr("transform",function(d) {  
                var s = ""
                self.DATA.x_columns.forEach(x1 => {s += d[x1] + ":"})
                var ind1 = self.x_domain.indexOf(s)

                s = ""
                self.DATA.y_columns.forEach(y1 => {s += d[y1] + ":"})
                var ind2 = self.y_domain.indexOf(s)

                return "translate("+self.x_range[ind1][0]+", "+self.y_range[ind2][1] +")" });

        if(self.DATA.peek){
            console.log("peeking!")

            // Categories.
            const N = d3.map(self.DATA.rolld[0][self.DATA.peek], d => d.name);
            console.log(N)
            self.pie_color = d3.scaleOrdinal(d3.schemeAccent)
                        .domain(N);
            
            const formatValue = d3.format(",");
            const title = (d) => `${d.name}\n${formatValue(d.value)}`;

            // Construct arcs.
            const arcs = d3.pie().value( v => v.value).sort( (a,b) => d3.ascending(a.name, b.name))
            const arc = d3.arc().innerRadius(0).outerRadius(r);

            self.dot
            .selectAll("path")
            .data(d => arcs(d[self.DATA.peek]))
            .enter()
            .append("path")
                .attr("fill", (d,i) => self.pie_color(d.data.name))
                .attr("d", arc)
            .append("title")
                .text(d => title(d.data));
        }
        else{
            // create the dots
            self.dot
            .append("circle")
            .attr("class", "point")
            .style("stroke-width", 1)
            .attr("stroke", "grey")
            .attr("r", r)
            .style("fill", d => self.color(d[self.DATA.value_column]));
        }
        // if(r >= 15){
        //     self.dot
        //     .append("text")
        //     .attr("text-anchor", "middle")
        //     .attr("dy", "0.25em")
        //     .style("font", "14px times")
        //     .style("fill", d => {
        //         var rgb = self.color(d[self.DATA.value_column]).match(/\d+/g).map(Number);

        //         // Calculate the brightness
        //         var brightness = (299 * rgb[0] + 587 * rgb[1] + 114 * rgb[2]) / 1000;
        //         return brightness < 130 ? "white": "black"
        //     })
        //     .text(d => self.format(d[self.DATA.value_column]))
        // }
        // install interaction events
        self.install_events()    
    }

    // Copyright 2021 Observable, Inc.
    // Released under the ISC license.
    // https://observablehq.com/@d3/histogram
    Histogram(data, {
        value = d => d, // convenience alias for x
        domain, // convenience alias for xDomain
        label, // convenience alias for xLabel
        format, // convenience alias for xFormat
        type = d3.scaleLinear, // convenience alias for xType
        x = value, // given d in data, returns the (quantitative) x-value
        y = () => 1, // given d in data, returns the (quantitative) weight
        thresholds = 40, // approximate number of bins to generate, or threshold function
        normalize, // whether to normalize values to a total of 100%
        marginTop = 5, // top margin, in pixels
        marginRight = 10, // right margin, in pixels
        marginBottom = 5, // bottom margin, in pixels
        marginLeft = 35, // left margin, in pixels
        width = 640, // outer width of chart, in pixels
        height = 400, // outer height of chart, in pixels
        insetLeft = 0.5, // inset left edge of bar
        insetRight = 0.5, // inset right edge of bar
        xType = d3.scaleBand, // type of x-scale
        xDomain = domain, // [xmin, xmax]
        xRange = [marginLeft, width - marginRight], // [left, right]
        xLabel = label, // a label for the x-axis
        xFormat = format, // a format specifier string for the x-axis
        yType = d3.scaleLinear, // type of y-scale
        yDomain, // [ymin, ymax]
        yRange = [height - marginBottom, marginTop], // [bottom, top]
        yLabel = "↑ Frequency", // a label for the y-axis
        yFormat = normalize ? "%" : undefined, // a format specifier string for the y-axis
        color = "currentColor", // bar fill color
        cls = "hist",
    } = {}) {
        // Compute values.
        const X = d3.map(data, x);
        const Y0 = d3.map(data, y);
        const I = d3.range(X.length);
    
        // Compute bins.
        const bins = d3.bin().thresholds(thresholds).value(i => X[i])(I);
        const Y = Array.from(bins, I => d3.sum(I, i => Y0[i]));
        if (normalize) {
        const total = d3.sum(Y);
        for (let i = 0; i < Y.length; ++i) Y[i] /= total;
        }
        console.log(bins, Y)
        // Compute default domains.
        if (xDomain === undefined) xDomain = d3.range(bins.length);
        if (yDomain === undefined) yDomain = [0, d3.max(Y)];
    
        // Construct scales and axes.
        const xScale = xType(xDomain, xRange);
        const yScale = yType(yDomain, yRange);
        // const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat).tickSizeOuter(0);
        const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);
        yFormat = yScale.tickFormat(100, yFormat);
    
        const svg = d3.create("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
    
        svg.append("g")
            .attr("transform", `translate(${marginLeft},0)`)
            .call(yAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll(".tick line").clone()
                .attr("x2", width - marginLeft - marginRight)
                .attr("stroke-opacity", 0.1))
            // .call(g => g.append("text")
            //     .attr("x", -marginLeft)
            //     .attr("y", 10)
            //     .attr("fill", "currentColor")
            //     .attr("text-anchor", "start")
            //     .text(yLabel));
    
        svg.append("g")
            .attr("fill", color)
        .selectAll("rect")
        .data(bins)
        .join("rect")
            .attr("class", cls)
            .attr("x", (d,i) => xScale(i))
            .attr("width", d => xScale.bandwidth())
            .attr("y", (d, i) => yScale(Y[i]))
            .attr("height", (d, i) => yScale(0) - yScale(Y[i]))
        .append("title")
            .text((d, i) => [`${d.x0} ≤ x < ${d.x1}`, yFormat(Y[i])].join("\n"));
    
        // svg.append("g")
        //     .attr("transform", `translate(0,${height - marginBottom})`)
        //     .call(g => g.append("text")
        //         .attr("x", width - marginRight)
        //         .attr("y", 10)
        //         .attr("fill", "currentColor")
        //         .attr("text-anchor", "end")
        //         .text(xLabel));
    
        return svg.node();
    }

    save_state (k){
        var self = this
        var obj = {};
        ['data', 'value_column', 'selected_attrs', 'selected_tuples', 'peek'].forEach(d => {
            obj[d] = JSON.parse(JSON.stringify(self.DATA[d]));
        })
        self.saved_data[k] = obj
    }
    load_state (k){
        var self = this
        var obj = self.saved_data[k];
        ['data', 'value_column', 'selected_attrs', 'selected_tuples', 'peek'].forEach(d => {
            self.DATA[d] = obj[d]
        })
    }

    // create the header components and events
    install_headers(){
        var self = this;

        // x and y axis pivot options
        // x and y axis pivot options
        $("#"+ self.x_axis_id + ">"+".menu").append('<div class="item" data-value="remove">Remove Pivoting</div>')
        $("#"+ self.y_axis_id + ">"+".menu").append('<div class="item" data-value="remove">Remove Pivoting</div>')
        $("#"+ self.peek_id + ">"+".menu").append('<div class="item" data-value="remove">Remove Peeking</div>')
        Object.keys(self.DATA.data[0]).forEach(k => {
          $("#"+ self.x_axis_id+ ">"+".menu").append('<div class="item" data-value="'+k+'">'+k+'</div>')
          $("#"+ self.y_axis_id+ ">"+".menu").append('<div class="item" data-value="'+k+'">'+k+'</div>')
          $("#"+ self.peek_id + ">"+".menu").append('<div class="item" data-value="'+k+'">'+k+'</div>')
        })
        // $(".ui.dropdown").dropdown({})

        // pivot operation
        $("#"+self.x_axis_id ).dropdown({
            onChange: (v, text, $choice) => {
                if(v == "remove")
                    self.DATA.selected_attrs = self.DATA.selected_attrs.filter(d => d.axis != "x")
                else
                    self.DATA.selected_attrs.push({'attr': v, 'axis': 'x'})

                $("#"+self.log_id + ">"+".menu").append('<div class="item log" data-value="pivot_'+v+'">'+
                '<div class="ui mini teal label">Pivot '+
                '<div class="detail">'+v+'</div></div></div>')
                // $("#"+self.log_id).dropdown({})
                // $(".item[data-value='"+v+"']").remove();
                self.DATA.pivot()
                self.redraw()
                self.save_state('pivot_'+v)
                console.log(self.saved_data)
                $("#" + self.pile_id).removeClass("disabled")
            }
        })
        $("#"+self.y_axis_id ).dropdown({
            onChange: (v, text, $choice) => {
                if(v == "remove")
                    self.DATA.selected_attrs = self.DATA.selected_attrs.filter(d => d.axis != "y")
                else
                    self.DATA.selected_attrs.push({'attr': v, 'axis': 'y'})

                $("#"+self.log_id + ">"+".menu").append('<div class="item log" data-value="pivot_'+v+'">'+
                '<div class="ui mini purple label">Pivot '+
                '<div class="detail">'+v+
                '</div></div></div>')
                // $("option[value='"+v+"']").remove();
                self.DATA.pivot()
                self.redraw()
                self.save_state('pivot_'+v)
                console.log(self.saved_data)
                $("#" + self.pile_id).removeClass("disabled")
            }
        })

        // peek operation
        $("#"+self.peek_id ).dropdown({
            onChange: (v, text, $choice) => {
                if(v == "remove" || v == "Peek")
                    self.DATA.peek = false
                else
                    self.DATA.peek = v

                self.DATA.pivot()
                self.redraw()
                $("#"+self.log_id + ">"+".menu").append('<div class="item" data-value="peek_'+v+'">'+
                '<div class="ui mini violet label">'+
                'Peek <div class="detail">'+v+
                '</div></div></div>')
                self.save_state('peek_'+v)
            }
        })

        // prune operation
        $("#" + self.prune_id).on("click", function(){
            var res = self.DATA.prune()
            // console.log(res)
            
            self.DATA.data = res.data
            self.DATA.selected_tuples = []

            // self.DATA.data.sort((a, b) => d3.ascending(a[v], b[v]))

            self.DATA.pivot()
            self.redraw()
            $("#"+self.log_id + ">"+".menu").append('<div class="item" data-value="prune_'+self.prune_num+'">'+
            '<div class="ui mini red label">'+
            '<i class="cut icon"></i><div class="detail">'+res.count+
            ' items</div></div></div>')

            $("#"+self.prune_id).addClass("disabled")
            $("#"+self.substrate_id).addClass("disabled")
            self.save_state('prune_'+self.prune_num)
            self.prune_num += 1
        })

        // substrate operation
        $("#" + self.substrate_id).on("click", function(){
            var res = self.DATA.projection()
            // console.log(res)
            
            self.DATA.data = res.data
            let name = "a"
            self.DATA.selected_tuples.forEach(s => {
                for(var k in s){
                    name += s[k] + "-"
                }
            })
            self.DATA.selected_tuples = []
            self.DATA.pivot()
            self.redraw()

            VIZ.add_new_card(name, "viz_parent", res.projection_data, self.DATA.index, self.DATA.value_column)

            $("#"+self.log_id + ">"+".menu").append('<div class="item" data-value="substrate_'+self.substrate_id+'">'+
            '<div class="ui mini blue label">'+
            '<i class="lightbulb icon"></i><div class="detail">'+res.count+
            ' items</div></div></div>')

            $("#"+self.prune_id).addClass("disabled")
            $("#"+self.substrate_id).addClass("disabled")
            self.save_state('substrate_'+self.substrate_id)
            self.substrate_id += 1
        })

        // piling
        $("#" + self.pile_id).on("click", function(){
            $('#'+ self.pile_modal)
                .modal('show')
            ;
        })
        $("#" + self.pile_confirm).on("click", function(){
            var name = $("#"+ self.pile_name).val()
            if(!name)
                return
            
            self.DATA.pile(name)
            self.DATA.selected_tuples = []
            self.DATA.pivot()
            self.redraw()

            $("#"+self.log_id + ">"+".menu").append('<div class="item" data-value="pile_'+name+'">'+
            '<div class="ui mini pink label">'+
            '<i class="align justify icon"></i><div class="detail">'+name+
            '</div></div></div>')
            self.save_state('pile_'+name)
        })

        // going back and forth in the interaction stack
        $("#"+self.log_id ).dropdown({
            onChange: (value, text, $choice) => {
                console.log(value, self.saved_data[value])
                self.load_state(value)
                console.log(self.DATA)
                self.DATA.pivot()
                self.redraw()
            }
        })

        //save data
        $("#"+self.export_id).on("click", function(){
            if(confirm("Do you want to save the data?")){
                $.ajax({
                    url: '/save_data',
                    data: JSON.stringify({ data: self.DATA.data}),
                    type: 'POST',
                    success: function (res) {
                        alert("saved succesfully!")
                    },
                    error: function (error) {
                        console.log("error !!!!");
                    }
                });
            }
        })
        
        // histogram interaction
        d3.selectAll("."+ self.histbar_class).on("mouseover", function(e, d){
            d3.select(e.currentTarget).attr("fill","orange")
        })
        d3.selectAll("."+ self.histbar_class).on("mouseout", function(e, d){
            d3.select(e.currentTarget).attr("fill","steelblue")
        })
        d3.selectAll("."+ self.histbar_class).on("click", function(e, d){
            var res = self.DATA.prune_by_range(d.x0, d.x1)
            self.redraw()
            // $("#"+self.log_id + ">"+".menu").append('<div class="item" data-value="prune_'+self.prune_num+'">'+
            // '<div class="ui mini red label">'+
            // '<i class="cut icon"></i><div class="detail">'+res.count+
            // ' items</div></div></div>')
        }) 
    }
}