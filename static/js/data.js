class Data {
    /* CONSTRUCTOR */
    constructor(data, index, value_column) {
        this.data = data;
        this.value_column = value_column;
        this.data = data.filter(d => d[index] != -1);
        this.selected_attrs = []
        this.selected_tuples = []
        this.peek = false
    }

    // Data operation 1: pivot
    pivot(){
        var self = this;
        self.x_columns = self.selected_attrs.filter( d => d['axis'] == 'x').map(d => d['attr'])
        self.y_columns = self.selected_attrs.filter( d => d['axis'] == 'y').map(d => d['attr'])
        self.all_columns = self.selected_attrs.map(d => d['attr'])

        self.data = self.data.sort(function(a, b) {
            for (const c of self.all_columns) {
                return d3.ascending(a[c], b[c])
            }
        });
          
        self.x_maps = self.x_columns.map(m => function(d) {return d[m]})
        self.y_maps = self.y_columns.map(m => function(d) {return d[m]})
        self.all_maps = self.all_columns.map(m => function(d) {return d[m]})

        self.x_group = d3.group(self.data, ...self.x_maps)
        self.y_group = d3.group(self.data, ...self.y_maps)

        if(self.peek)
            self.rolld = d3.flatRollup(self.data, v => d3.flatRollup(v, a => a.length, d => d[self.peek]),
             ...self.all_maps)
        else
            self.rolld = d3.flatRollup(self.data, v => d3.sum(v, d => d[self.value_column]), ...self.all_maps)

        self.x_hierarchy = (function(){
             let i = 0; 
             return d3.hierarchy(self.x_group).eachBefore(d => {d.index = d.children ? i++ : i}); 
        })()
        self.y_hierarchy = (function(){
            let i = 0; 
            return d3.hierarchy(self.y_group).eachBefore(d => {d.index = d.children ? i++ : i}); 
        })() 
        
        if(self.all_columns.length){
            if(self.peek)
                var combined_attrs = self.all_columns.concat([self.peek])
            else
                var combined_attrs = self.all_columns.concat([self.value_column])

            self.rolld = self.rolld.map(d => {
                var obj = {}
                d.forEach( (ele, i) => {
                    if(combined_attrs[i] == self.peek){
                        var v = []
                        var count = 0
                        ele.forEach(e => {count += e[1]; v.push({"name": e[0], "value": e[1]})})
                        obj[combined_attrs[i]] = v 
                        obj[self.value_column] = count
                    }
                    else
                        obj[combined_attrs[i]] = ele 
                });
                return obj
            })
        }
        else{
            if(self.peek)
                self.rolld = [{"":"", [self.peek]: self.rolld.map(d => { return {"name": d[0], "value": d[1]}})}]
            else
                self.rolld = [{"":"", [self.value_column]: self.rolld}]
        }    
    }

    //Data operation 2: prune
    prune(){
        var self = this;
        var res = self.create_pruned_dataset(self.selected_tuples, self.data)
        return res
    }
    // remove the items matching the pruning queries
    create_pruned_dataset(selected_tuples, data){
        var count = 0;
        var data2 = []
        selected_tuples.forEach(t => {
            var prunedArray = JSON.parse(JSON.stringify(data));
            data = []
            prunedArray.forEach((d,i) => {
                var match = 1
                for(var k in t){
                    if (d[k] != t[k])
                        match  = 0
                }
                if(!match){
                    // console.log(d)
                    data.push(d)
                }
                else{
                    count += 1
                    data2.push(d)
                }
            })
        })
        return {count: count, data: data, projection_data: data2}
    }
    // prune values between x0 and x1
    prune_by_range(x0, x1){
        var self = this;
        var copiedArray = JSON.parse(JSON.stringify(self.data)),
        data = []
        var count = 0 
        copiedArray.forEach((d,i) => {
            if( (d[self.value_column] < x1 ) && (d[self.value_column] >= x0))
                count += 1
            else
                data.push(d)       
        })
        self.data = data
        self.pivot()
        return {count: count, data: data}

    }

    //Data operation 3: projection
    projection(){
        var self = this;
        return self.prune()
    }

    //Data operation 4: pile
    pile(name){
        var self = this;
        self.data.forEach(d => {
            self.selected_tuples.forEach(t => {
                for(var k in t){
                    if (d[k] == t[k])
                        d[k] = name
                }
            })
        })
    }
}