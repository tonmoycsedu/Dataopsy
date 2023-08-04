// create x axis labels
function Label_x (root, svg, x_columns, {
    nodeSize_x1 = 20,
    nodeSize_x2 = 10,
    offset = 100
} = {}) {
    const nodes = root.descendants().filter(d => d.children);
    if(!nodes.length){
        var x_domain = [""]
        var x_range = [[svg.width/2, offset]]
    }
    else{
        var x_domain = get_domain( root, "", [])
        var x_range = nodes.filter(d => d.height == 1).map(d => [d.index * nodeSize_x1 + offset, d.depth * nodeSize_x2])

        const g = svg['g'].append("g")
        .attr("class", "x_labels")
        .attr("transform",
            "translate(" + offset + ",0 )");

        const link = g.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
        .selectAll("path")
        .data(root.links().filter(d => d.target.children))
        .join("path")
            .attr("d", d => `
            M${d.source.index * nodeSize_x1}, ${d.source.depth * nodeSize_x2}
            H${d.target.index * nodeSize_x1}
            v${nodeSize_x2}
            `);

        const legend = g.append("g")
            .selectAll("text")
            .data(x_columns)
        .join("text")
        .style("font-size", "14px")
        .attr("dy", "0.32em")
        // .attr("dx", "-0.9em")
        .attr("x", -svg.margin.left)
        .attr("y", (d,i) => (i+1) * nodeSize_x2)
        .text(d => d);
    
        const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
            .attr("transform", d => `translate(${d.index * nodeSize_x1}, 0)`)
            .attr("class", "x chart_label");
    
        node.append("circle")
            .attr("cy", d => d.depth * nodeSize_x2)
            .attr("r", 2.5)
            .attr("fill", d => d.children ? null : "#999");
    
        node.append("text")
            .attr("dy", "0.32em")
            .attr("y", d => d.depth * nodeSize_x2 + 6)
            .text(d => d.data[0]);
    }
    return {domain: x_domain, range: x_range}
}

//create y-axis labels
function Label_y (root, svg, y_columns, {
    nodeSize_y1 = 12,
    nodeSize_y2 = 12,
    offset = 50,
} = {}) {
    const nodes = root.descendants().filter(d => d.children);
    if(!nodes.length){
        var y_domain = [""]
        var y_range = [[offset, svg.height/2]]
    }
    else{
        var y_domain = get_domain( root, "", [])
        var y_range = nodes.filter(d => d.height == 1).map(d => [d.depth * nodeSize_y2, d.index * nodeSize_y1 + offset])

        const g = svg['g'].append("g")
        .attr("class", "y_labels")
        .attr("transform",
            "translate(0, "+ offset +" )");
    
        const link = g.append("g")
            .attr("fill", "none")
            .attr("stroke", "#999")
        .selectAll("path")
        .data(root.links().filter(d => d.target.children))
        .join("path")
            .attr("d", d => `
            M${d.source.depth * nodeSize_y2},${d.source.index * nodeSize_y1}
            V${d.target.index * nodeSize_y1}
            h${nodeSize_y2}
            `);
        if(y_columns.length >= 1){
            const legend = g.append("g")
                .selectAll("text")
                .data([y_columns[0]])
            .join("text")
            .style("font-size", "14px")
            // .style("font-weight", "bold")
            // .attr("dy", "0.8em")
            .attr("y", (d,i) => - 10)
            .attr("x", (d,i) => - 10)
            .text(d => d);
        }
    
        const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
            .attr("transform", d => `translate(0,${d.index * nodeSize_y1})`)
            .attr("class", "y chart_label")
    
        node.append("circle")
            .attr("cx", d => d.depth * nodeSize_y2)
            .attr("r", 2.5)
            .attr("fill", d => d.children ? null : "#999");
    
        node.append("text")
            .attr("dy", "0.32em")
            .attr("x", d => d.depth * nodeSize_y2 + 6)
            .text(d => d.data[0]);
    }
    // console.log(y_domain, y_range)
    return {domain: y_domain, range: y_range}
}

//create the flat domain
function get_domain(hierarchy, s, domain){
    if (!("children" in hierarchy)){
        if(domain.indexOf(s) == -1)
            domain.push(s)
        return
    }
    if (typeof hierarchy.data[0] !== 'undefined'){
        // console.log(hierarchy)
        s = s + hierarchy.data[0] + ":"
    }
    hierarchy.children.forEach((c) => {
        get_domain(c, s, domain)
    })

    return domain
}