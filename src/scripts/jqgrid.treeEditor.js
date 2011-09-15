// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS

/**
 * @license jqGrid TreeEditor 1.0 
 * Copyright (c) 2011, Andrey Lapin, trurl123@gmail.com
 * Dual licensed under the MIT and GPL licenses
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
 * Date: 2011-07-11
 */
//jsHint options
/*global document, window, jQuery, DOMParser, ActiveXObject, localStorage, ZeroClipboard, console, $ */

(function($) {  $.jgrid.extend({

    getRow : function(id) {
        return this.getInd(id,true);
    },

    getIdx : function(id) {
        return this[0].p._index[parseInt(id,10)];
    },
    
    getRc : function(id) {
        var p = this[0].p;
        id = parseInt(id,10);
        if (p._index[id] !== undefined) {
            return p.data[p._index[id]];
        } else {
            return null;
        }
    },
    
    getPrevRow : function(row,onlyVisible) {
        while (true) {
            if (row) {
                row = row.previousSibling;
            }
            if (!row || !$(row).hasClass('jqgrow')) {
                return null;
            }
            if(!onlyVisible || !$(row).is(":hidden")) {
                return row;
            }
        }
    },

    getNextRow : function(row,onlyVisible) {
        while (true) {
            if (row) {
                row = row.nextSibling;
            }
            if (!row || !$(row).hasClass('jqgrow')) {
                return null;
            }
            if(!onlyVisible || !$(row).is(":hidden")) {
                return row;
            }
        }
    },
    
    selSiblingRow : function(row, prev) {
        if (!row && this[0].rows.length>1) {
            row = this[0].rows[1];
        }
        var t, wasEdit, aria, r; 
        r = prev ? this.getPrevRow(row,true) : this.getNextRow(row,true);
        if(r) {
            t = this;
            if (t[0].lastEdited) {
                if (document.activeElement) {
                    aria = $(document.activeElement.parentNode).attr('aria-describedby');
                }
                t.finishEdit();
                wasEdit = true;
            }
            t.setSelection(r.id,false);
            if (wasEdit) {
                t.startEdit(r);
                if (aria) {
                    $("td[aria-describedby='"+aria+"'] input",r).focus().select();
                }                
            }
        }
    },
    
    selNextRow : function(row) {
        this.selSiblingRow(row,false);
    },

    selPrevRow : function(row) {
        this.selSiblingRow(row,true);
    },

    updateRow : function(rc) {
        var rowInd = this.getInd(rc.id);
        if (rc.parent) {
            rc.level = this.getRc(rc.parent).level+1;            
        } else {
            rc.level = 0;
        }
        rc.loaded = true;
        $('#'+rc.id+' .tree-wrap').remove();
        this.setTreeNode(rowInd,rowInd+1);
    },

    checkLostChildren : function(rc) {
        var  
            childs = this.getNodeChildren(rc);
        if (!childs.length) {
            rc.isLeaf = true;
            rc.expanded = false;
            this.updateRow(rc);
        }
    },

    deleteSubtree : function(rc) {
        var t = this, 
            parentId = rc.parent,
            parentRc = null, prevRow, prevRc;
        //get next non-child    
        prevRow = t.getPrevRow(t.getRow(rc.id));
        t.delTreeNode(rc.id);
        if (parentId) {
            parentRc = t.getRc(rc.parent);
            t.checkLostChildren(parentRc);
        }
        t.recalcDuration(parentRc);
        if (prevRow) {
            prevRc = t.getRc(prevRow.id);
            t.setSelection(prevRc.id,false);
        }    
        t.raiseSave();
    },

    /*deleteSubtree0 : function(idx) {
        var t = this, 
            data = t[0].p.data, 
            rc = data[idx], childs, i;
        childs = t.getNodeChildren(data[idx]);
        for (i=0; i<childs.length; i++) {
            t.deleteSubtree0(t.getIdx(childs[i]));
        }
    },*/
    
    recalcDuration : function(rc, noRecursive) {
        var t = this, 
            duration = 0, childs;
        if (rc) {
            childs = t.getNodeChildren(rc);
        } else {
            childs = t.getRootNodes();
        }
        $.each(childs, function() {
            duration += parseFloat(this.duration);
        });
        if (rc) {
            rc.duration = duration;
            t.setCell(rc.id,'duration',duration,false,false,true);
        }
        if (!rc) {
            t.footerData("set",{duration:duration});
        }
        if (rc && !noRecursive) {
            if (rc.parent) {
                t.recalcDuration(t.getRc(rc.parent));
            } else {
                t.recalcDuration(null);
            }
        }
    },
    
    updateSubtree : function(rc) {
        var t = this, 
            childs;
        t.updateRow(rc);
        childs = t.getNodeChildren(rc);
        $.each(childs, function() {
            t.updateSubtree(t.getRc(this.id));
        });
    },
    
    insertEmpty: function(rc, isBefore) {
        var t = this,
            maxId = 0, 
            position = 'last', 
            srcid = '',
            level = 0,
            parent = null, newId, newRc;
            
        $.each(t[0].p.data, function() {
          if (maxId<parseInt(this.id,10)) {
              maxId = parseInt(this.id,10);
          }
        });
        if (maxId && rc) {
            position = isBefore ? 'before' : 'after';
            srcid = rc.id;
            if (rc.isLeaf || isBefore) {
                level = rc.level;
                parent = rc.parent;
            } else {
                level = rc.level+1;
                parent = parseInt(rc.id,10);
            }
        }
        newId = maxId+1;
        t.addRowData(newId,{id:newId.toString(),isLeaf:true,level:level,name:'',parent:parent,
            duration:0},position,srcid);
        newRc = t.getRc(newId);
        t.updateRow(newRc);
        t.setSelection(newId,false);
        t.startEdit(newRc);
    },

    moveLeft: function(rc) {
        var t = this, 
            level = rc.level,
            subRc, parentRc, row;
        if (level) {
            level -= 1;
            rc.level = level;
            parentRc = t.getRc(rc.parent);
            if (level) {
                rc.parent = parentRc.parent;
            } else {
                rc.parent = null;
            }
            
            t.rememberLastEdit();    
            //append childs if rc become parent
            row = t.getRow(rc.id);
            while (true) {
                row = t.getNextRow(row);
                if (!row) {
                    break;
                }
                subRc = t.getRc(row.id);
                if (subRc.level <= level) {
                    break;
                }
                if (subRc.level-1 === level) {
                    if (rc.isLeaf) {
                        rc.isLeaf = false;
                        rc.expanded = true;
                        rc.loaded = true;
                        t.updateRow(rc);
                    }
                    subRc.parent = parseInt(rc.id,10);
                    t.updateRow(subRc);
                }
            }
            t.updateSubtree(rc);

            //detect if parent lost all children
            t.checkLostChildren(parentRc);

            t.recalcDuration(parentRc,true);
            t.recalcDuration(rc);
            t.restoreLastEdit();
        }
        t.raiseSave();
    },
    
    moveRight: function(rc) {
        var t = this, 
            level = rc.level, row, parentRc;
        if (!rc) {
            return;
        }
        row = t.getRow(rc.id);
        while (true) {
            row = t.getPrevRow(row);
            if (!row || t.getRc(row.id).level < level) {
                return;
            }
            if (t.getRc(row.id).level === level) {
                break;
            }
        }
        if (row) {
            t.rememberLastEdit();    
            parentRc = t.getRc(row.id);
            level += 1;
            rc.level = level;
            rc.parent = parseInt(parentRc.id,10);
            parentRc.expanded = true;
            parentRc.isLeaf = false;
            parentRc.loaded = true;
            t.updateRow(parentRc);
            t.updateSubtree(rc);
            t.recalcDuration(parentRc);
            t.restoreLastEdit();
            t.raiseSave();
        }
    },

    moveChildren: function(row, nextRow) {
        var t = this, 
            nextRc, nextNextRow,
            level = t.getRc(row.id).level;
        while (nextRow) {
            nextRc = t.getRc(nextRow.id);
            if (nextRc.level <= level) {
                return;
            }
            nextNextRow = t.getNextRow(nextRow);
            $(row).after($(nextRow));
            row = nextRow;
            nextRow = nextNextRow;
        }
    },

    rememberLastEdit: function() {
        var t = this; 
        t[0].editedId = null;
        if (t[0].lastEdited) {
            if (document.activeElement) {
                t[0].editedId = document.activeElement.id;
            }
        }
    },

    restoreLastEdit: function() {
        var t = this;
        if (t[0].editedId) {
            $("#"+t[0].editedId).focus();
        } 
    },

    moveUp: function(rc) {
        var t = this, 
            row, prevRow, prevRc, childRow; 
        row = t.getRow(rc.id);

        //find previous sibling row with same level or higher  
        prevRow = t.getPrevRow(row);
        while (prevRow) {
            prevRc = t.getRc(prevRow.id);
            if (prevRc.level <= rc.level) {
                break;
            }
            prevRow = t.getPrevRow(prevRow);
        }
        if (!prevRow) {
            return;
        }
    
        t.rememberLastEdit();    
        childRow = t.getNextRow(row);
        if (prevRc.level === rc.level) {
            $(prevRow).before($(row));
        } else {
            return;
        }
        t.moveChildren(row, childRow);
        t.updateSubtree(rc);
        t.restoreLastEdit();    
        t.raiseSave();
    },

    moveDown: function(rc) {
        var t = this, 
            row, nextRow, nextRow0, nextRc, childRow, i; 
        row = t.getRow(rc.id);

        nextRow = row;

        //i=0 - skipping children of moved rc
        //i=1 - skipping children of next sibling rc
        for (i = 0; i<2; i++) {
            while (true) {
                nextRow0 = nextRow;  
                nextRow = t.getNextRow(nextRow);
                if (!nextRow) {
                    break;
                }
                nextRc = t.getRc(nextRow.id);
                if (nextRc.level <= rc.level) {
                    break;
                }
            }
            if (i === 0) {
                if (!nextRow || nextRc.level < rc.level) {
                    return;
                }
            }
        }

        nextRow = nextRow0;

        t.rememberLastEdit();    
        childRow = t.getNextRow(row);
        $(nextRow).after($(row));
        t.moveChildren(row, childRow);
        t.updateSubtree(rc);
        t.restoreLastEdit();    
        t.raiseSave();
    },
    
    raiseSave: function() {
        var t = this, $t = t[0];
        if (!$t.raiseSaveHandler) {
            $t.raiseSaveHandler = $.debounce( 
            function() { 
                t.savePlan(); 
            }, 5000 );    
        }
        if ($t.p.onRaiseSave) {
            $t.p.onRaiseSave();
        }
        $t.raiseSaveHandler();
    },
    
    exportJSON: function() {
        var t = this, 
            id, ids, stor = [],
            $t = t[0];
        ids = t.getDataIDs();
        $.each(ids, function() {
            id = this;
            stor.push(t.getRc(id));
        });
        t.fixItemsArray(stor);
        return JSON.stringify(stor);
    },

    savePlan: function(callback) {
        var t = this, 
            $t = t[0];
        if ($t.planShared) {
            $.callAJAX({ action: 'savePlan', id: window.location.hash.substr(1), userid: localStorage['userid'], plan: t.exportJSON()}, function(result) {
                if (result) {
                    if (callback) {
                        callback();
                    }
                    if ($t.p.onSave) {
                        $t.p.onSave();
                    } 
                } else {
                }
            },'json');
        } else {
            t.saveToLocalStorage();
            if (callback) {
                callback();
            }
            if ($t.p.onSave) {
                $t.p.onSave();
            } 
        } 
    },
    
    saveToLocalStorage: function() {
        var t = this, 
            $t = t[0];
        localStorage['tasklist'] = t.exportJSON();
    }, 

    fixItemsArray: function(stor) {
        var  
            i, index = {}, parents = [], lastLevel = 0, id, dur=[], curDur;
        for (i=0; i<stor.length; i++) {
            id = stor[i].id;
            if (index[id] !== undefined) {
                stor.splice(i,1);
                if (console) {
                    console.debug('duplicate id '+id);
                }
            } else {
                index[id] = i;
            }
        }
        parents[0] = null;
        for (i=0; i<stor.length; i++) {
            stor[i].level = parseInt(stor[i].level,10);
            if (stor[i].level > lastLevel+1) {
                if (console) {
                    console.debug('fix level for '+i.toString()+':'+(stor[i].level).toString()+' to '+(lastLevel+1).toString());
                }
                stor[i].level = lastLevel+1;
            }
            parents[stor[i].level+1] = parseInt(stor[i].id,10);
            if (stor[i].parent !== null) {
                stor[i].parent = parseInt(stor[i].parent,10);
            }
            if (stor[i].parent !== parents[stor[i].level]) {
                if (console) {
                    console.debug('fix parent for '+i.toString()+':'+stor[i].parent+' to '+parents[stor[i].level]);
                }
                stor[i].parent = parents[stor[i].level];  
            }
            lastLevel = stor[i].level;
            stor[i].expanded = true;
            stor[i].loaded = true;
        }
        for (i=0; i<stor.length; i++) {
            if ((i === stor.length-1) || (stor[i+1].parent !== parseInt(stor[i].id,10))) {
                stor[i].isLeaf = true;
                stor[i].expanded = false;
            } else {
                stor[i].isLeaf = false;
                stor[i].expanded = true;
            }
        }
        for (i=stor.length-1; i>=0; i--) {
            if (!stor[i].isLeaf) {
                stor[i].duration = dur[stor[i].level];
                dur[stor[i].level] = 0;
            }
            if (stor[i].level>0) {
                if (dur[stor[i].level-1] === undefined) {
                    dur[stor[i].level-1] = 0;
                }
                dur[stor[i].level-1] += parseFloat(stor[i].duration);
            } 
        }
    },

    importJSON: function(json) {
        var t = this, 
            rc, 
            stor, i;
        try {    
            stor = JSON.parse(json);
            t.loadArray(stor);
            return true;
        } catch (e) {
        }
        return false;
    },
    
    loadFromLocalStorage: function() {
        var t = this, 
            rc, 
            stor, i;
        try {    
            stor = JSON.parse(localStorage['tasklist']);
        } catch (e) {
        }
        if (!stor) {
            t.addRowData(1,{id:'1',isLeaf:false,level:0,name:'Task1',parent:null,
                duration:1, expanded: true},'last',null);
            t.addRowData(2,{id:'2',isLeaf:true,level:1,name:'Task2',parent:1,
                duration:1},'last',null);
            t.addRowData(3,{id:'3',isLeaf:true,level:0,name:'Task3',parent:null,
                duration:1},'last',null);
            for (i=1; i<=3; i++) {
                t.updateRow(t.getRc(i));
            }
            t.recalcDuration(null);
            return;
        }
        t.loadArray(stor);
    },
    
    startEdit: function(row) {
        if (!row) {
            return;
        }
        var t = this, $t = t[0], duration; 
        if (!$t.lastEdited  || row.id!==$t.lastEdited) {
            if ($t.lastEdited) {
                t.finishEdit();
            }
            $t.lastEdited=row.id;
            duration = t.getCell($t.lastEdited,'duration');
            if (duration === "0") {
                t.setCell($t.lastEdited,'duration',"",false,false,true); 
            }
            t.editRow(row.id,true,null,null,'clientArray',{},
                function() { 
                    t.setSelection($t.lastEdited,false);
                    t.finishEdit(); 
                },
                null, 
                function() {
                    $(t.getRow($t.lastEdited)).focus();
                    $t.lastEdited = null;
                } );
        }
    },

    finishEdit: function(noRaise) {
        var t = this, $t = t[0], duration; 
        if ($t.lastEdited) {
            t.saveRow($t.lastEdited, false, 'clientArray');
            duration = parseFloat(t.getCell($t.lastEdited,'duration')); 
            if (isNaN(duration)) {
                duration = 0;
            }
            t.setCell($t.lastEdited,'duration',duration,false,false,true); 
            t.recalcDuration(t.getRc($t.lastEdited));
            t.restoreRow($t.lastEdited);
            $(t.getRow($t.lastEdited)).focus();
            $t.lastEdited = null;
            if (!noRaise) {
                t.raiseSave();
            }
        }
    },

    exportHtml: function() {
        var t = this, ids, id, rc, 
            result = "",
            border = "border: 1px solid black;",
            padding = "padding: 3px;",
            stdStyle = border + padding,
            footerStyle = border + "padding: 10px 3px 3px 3px; font-weight: bold;",
            headStyle = "text-align:center; "+stdStyle, fontSize;
        ids = t.getDataIDs();
        result += "<table style='"+border+" border-collapse: collapse;'><tr>"+
            "<th style='"+headStyle+"'>Name</th>"+
            "<th style='"+headStyle+"'>Duration</th></tr>";
        $.each(ids, function() {
            id = this;
            rc = t.getRc(id);
            fontSize = (rc.level > 2 ) ? '100' : (100 + (2-rc.level)*20).toString();    
            result += "<tr><td style='font-size:"+fontSize+"%; padding: 3px 5px 3px "+(5+rc.level*20).toString()+"px; "+border+"'>" + 
                rc.name + "</td><td style='text-align:right; "+stdStyle+"'>" + 
                (rc.duration).toString() + "</td>" +"</tr>";
        });
        result += "<tr><td style='"+footerStyle+"'>" + 
             "</td><td style='text-align:right; "+footerStyle+"'>" + 
            t.footerData("get").duration.toString() + "</td>" +"</tr>";
        result += "</table>";
        return result;
    },
    
    exportCSV: function() {
        var t = this, ids, id, rc, 
            result = ""; 
        ids = t.getDataIDs();
        result += "id;Level;Parent;Name;Duration;\n";
        $.each(ids, function() {
            id = this;
            rc = t.getRc(id);
            result += rc.id + ";" + rc.level.toString() + ";" + rc.parent + ";" + rc.name + ";"+(rc.duration).toString() + "\n";
        });
        return result;
    },

    loadArray: function(stor) {
        var t = this, 
            rc, i;
        t.clearGridData();
        t.fixItemsArray(stor);
        for (i=0; i<stor.length; i++) {
            rc = stor[i];
            t.addRowData(rc.id,rc,'last');
            t.updateRow(t.getRc(rc.id));
        }
        t.recalcDuration(null);
    },

    importCSV: function(text) {
        var t = this, 
            rc, 
            stor = [], i, lines, line, j;
        lines = text.split("\n");            
        for (i=1; i<lines.length; i++) {
            lines[i] = lines[i].trim();
            if (lines[i]) {
                line = lines[i].split(";");
                for (j=0; j<line.length; j++) {
                    line[j] = line[j].trim();
                    if (line[j] === "null") {
                        line[j] = null;
                    }                    
                }
                rc = {id:line[0], level:line[1], parent:line[2], name:line[3], duration:line[4]};
                stor.push(rc);
            }
        }
        t.loadArray(stor);
        t.raiseSave();
    },
    
    initFocus: function() {
        var t=this, $t=t[0], id;
        t.focus();
        if ($t.p.data && $t.p.data.length) {
            id = $t.p.data[0].id;
            t.setSelection(id,false);
            $(t.getRow(id)).focus();
        }
    },

    removeAll: function() {
        var t=this;
        t.clearGridData();
        t.recalcDuration(null);
        t.raiseSave();
    }

});})(jQuery);

$.callAJAX = function(postData, func) {
    $.post('ajax.php',postData, function(data, textStatus) {
        if (!data) {
            $.showPopup('Something goes wrong...');
        } else if (data.error !== undefined) {
            $.showPopup(data.error);
        } else if (data.ok !== undefined) {
            func(data.result);
        } else {
            $.showPopup('Something goes wrong: ' + data);
        }
    },'json');
};

$.createUUID = function () {
    // http://www.ietf.org/rfc/rfc4122.txt
    var s = [];
    var hexDigits = "0123456789ABCDEF";
    for (var i = 0; i < 32; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[12] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01

    var uuid = s.join("");
    return uuid;
};



(function($) {

$.extend({
    initPlanEditor: function() {
        if (localStorage['userid'] === undefined || localStorage['userid'] === null || localStorage['userid'].length!==32) {
            localStorage['userid'] = $.createUUID(); 
        }
        window.disqus_shortname = undefined;
        $("#tasklist").jqGrid({
            treeGrid: true,
            treeGridModel: 'adjacency',
            ExpandColumn : 'name',
            //url: 'clientArray', // 'getTreeData.php',
            datatype: "local",
            mtype: "POST",
            sortable: false,
            height: '100%',
            colNames:['Name', 'Duration','ID'],
            colModel:[
                {name:'name',index:'name', width:300, editable: true, editoptions:{maxlength:"300", autocomplete:"off"}, sortable: false}, //size:"20"
                {name:'duration',index:'duration',align:"right", width:90, editable: true, editoptions:{autocomplete:"off"}, sortable: false },
                {name:'id', index:'id', width:50, sorttype:"int", editable: false, sortable: false}
            ],
            onSelectRow: function(id){
                //t.startEdit(t.getRow(id));
            },
            onRaiseSave: function() {
                $("#saveBtn").button({ disabled: false });
            },
            onSave: function() {
                $("#saveBtn").button({ disabled: true });
            },
            onCellSelect: function(id,iCol,cellcontent,e) {
                var t = $("#tasklist"), r = t.getRow(id);
                t.startEdit(r);
                $("td:eq("+iCol+") input",r).focus().select();
            },
            footerrow: true 
        });

        $(window).keydown(function(event){
            var t = $("#tasklist"), 
                target = t.find('tr[tabindex=0]')[0], rc; 
            //check for keys
            if (target) {
                rc = t.getRc(target.id);
            }
            //up arrow
            if(event.which === 38 && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault();
                t.selPrevRow(target);
            }
            //if key is down arrow
            else if(event.which === 40 && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault();
                t.selNextRow(target);
            }
            //insert
            else if(event.which === 45 && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                event.preventDefault();
                t.insertEmpty(rc, false);
            }
            //insert prev
            else if(event.which === 45 && event.ctrlKey && event.altKey && !event.shiftKey) {
                event.preventDefault();
                t.insertEmpty(rc, true);
            }
            if (target) {
                //up arrow
                if(event.which === 38 && event.ctrlKey && event.altKey && !event.shiftKey) {
                    t.moveUp(rc);
                    event.preventDefault();
                }
                //if key is down arrow
                else if(event.which === 40 && event.ctrlKey && event.altKey && !event.shiftKey) {
                    t.moveDown(rc);
                    event.preventDefault();
                }
                //left
                else if(event.which === 37 && event.ctrlKey && event.altKey && !event.shiftKey) {
                    t.moveLeft(rc);
                    event.preventDefault();
                }
                // right
                else if(event.which === 39 && event.ctrlKey && event.altKey && !event.shiftKey) {
                    t.moveRight(rc);
                    event.preventDefault();
                }
                //F2
                else if(event.which === 113 && !event.ctrlKey && !event.altKey && !event.shiftKey) {
                    t.startEdit(target);
                    event.preventDefault();
                }
                //delete
                else if(event.which === 46 && event.ctrlKey && !event.altKey && !event.shiftKey) {
                    event.preventDefault();
                    $.okCancelDialog('Remove item and all subitems?','Remove',
                        function() { 
                            //$(this).dialog("close"); 
                            t.deleteSubtree(rc);
                        }
                    );
                }
            }
        });

        var t = $("#tasklist"), $t = t[0], id;
        $t.planShared = false;
        if (window.location.hash !== "") {
            $.callAJAX({ action: 'getPlan', id: window.location.hash.substr(1), userid: localStorage['userid']}, function(result) {
                var own = result.substr(0,1);
                result = result.substr(1);
                if (t.importJSON(result)) {
                    if (own === "1") {
                        $t.planShared = true;
                        $.showPopup('Loaded your own plan');
                        $("#shareBtn").button({ label: 'Unshare' });
                        $("#shareBtn").attr('title', 'Stop to store current plan to server');
                    } else {
                        $.messageBox('Loaded shared plan. All changes will not be uploaded to server.','Loaded');
                    }
                }
                if (!$t.planShared) {
                    window.location.hash = "";
                }
                t.initFocus();
            });            
        } else {
            if (window.localStorage !== undefined) {
                t.loadFromLocalStorage();
            }
            t.initFocus();
        }
        
        $(".button").button();
        $("#saveBtn").button({ disabled: true });
        $("#saveBtn").click( function() {
            t.finishEdit(true);
            t.savePlan(function() {
                $.showPopup('Successfully saved');
            });
        });
        $(".panelButton").click( function() {
            var pan = $("#"+this.id.replace(/Btn/,'')+'Panel');
            if (! pan.is(":visible") ) {
                if ($(".panel").is(":visible")) {
                    $(".panel").hide();
                }
                pan.show('fast', function() {
                    if (this.id === 'disqusPanel' && window.disqus_shortname === undefined) {
                        window.disqus_shortname = 'eazzyplan'; // required: replace example with your forum shortname
                    
                        // The following are highly recommended additional parameters. Remove the slashes in front to use.
                        var disqus_identifier = 'eazzyplan';
                        var disqus_url = 'http://wiki4tech.ru/eazzyplan/';
                        if (!window.productionMode) {
                            var disqus_developer = 1;
                        }
                    
                        /* * * DON'T EDIT BELOW THIS LINE * * */
                        (function() {
                            var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
                            dsq.src = 'http://' + window.disqus_shortname + '.disqus.com/embed.js';
                            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
                        })();
                    }
                });
                
                //$('html,body').animate( {scrollTop: pan.offset().top }, 1000);
            } else {
                pan.hide('slow');
            }
        });

        $("#pasteBtn").click( function() {
            $('#pasteDialog').dialog(
                { 
                    buttons: { 
                        "Import" : function() {
                            t.importCSV($('#pasteText').val());        
                            $(this).dialog("close"); 
                        },
                        "Cancel" : function() {
                            $(this).dialog("close"); 
                        }
                    },
                    modal: true,
                    width: 550,
                    title: 'Import'
                }
            );
        });
        
        var clip, clip2;
        ZeroClipboard.setMoviePath( 'ZeroClipboard10.swf' );
        clip = new ZeroClipboard.Client();
        clip.setHandCursor( true );
        clip.setCSSEffects( false );

        clip.addEventListener( 'mouseDown', function() { 
            // set text to copy here
            clip.setText( t.exportHtml() );
            //alert("mouse down"); 
        } );
        clip.addEventListener('complete', function () {
            $.showPopup("Table copied to clipboard");
        });
        //clip.addEventListener('load', function (client) {
        //            console.debug("Flash movie loaded and ready.");
        //        });                                    
        clip.glue( 'rtfBtn','rtfBtnOwner');

        clip2 = new ZeroClipboard.Client();
        clip2.setHandCursor( true );
        clip2.setCSSEffects( false );

        clip2.addEventListener( 'mouseDown', function(client) { 
            // set text to copy here
            clip2.setText( t.exportCSV() );
            //alert("mouse down"); 
        } );
        clip2.addEventListener('complete', function (client, text) {
            $.showPopup("CSV copied to clipboard");
        });
        //clip.addEventListener('load', function (client) {
        //            console.debug("Flash movie loaded and ready.");
        //        });                                    
        clip2.glue( 'csvBtn','csvBtnOwner');
        
        $('#shareBtn').click(function() {
            if ($t.planShared) {
                $.okCancelDialog('Stop to store current plan to server?','Unshare',function() {
                    $t.planShared = false;
                    $("#shareBtn").button({ label: 'Share' });
                    window.location.hash = "";
                    t.savePlan();
                });
            } else {
                $.okCancelDialog('Save plan to server and share?','Share',function() {
                    $.callAJAX({ action: 'createPlan', plan: t.exportJSON(), userid: localStorage['userid']}, function(result) {
                        window.location.hash = '#'+result;
                        $.messageBox('The plan is saved to server. Now you can send current URL to friends and use it to edit.');
                        $("#shareBtn").button({ label: 'Unshare' });
                        $("#shareBtn").attr('title', 'Stop to store current plan to server');
                        $t.planShared = true;
                    },'json');
                });
            }
        });

        $('#clearBtn').click(function() {
            $.okCancelDialog('Remove all items?','Clear',function() {
                t.removeAll();
            });
        });
    }
});

})(jQuery);

