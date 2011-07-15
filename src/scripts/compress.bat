rem java -jar yuicompressor-2.4.6.jar -v -o jquery.jqGrid.min2.js jquery.jqGrid.src.js
rem java -jar compiler.jar --js=jquery.jqGrid.src2.js --js_output_file=jquery.jqGrid.min3.js
call closure_comp.bat jquery.jqGrid.src.js jquery.jqGrid.min.js
call closure_comp.bat jqgrid.treeEditor.js jqgrid.treeEditor.min.js
call closure_comp.bat messageBox.js messageBox.min.js
