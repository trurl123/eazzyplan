<?php

defined('APPLICATION_PATH')
|| define('APPLICATION_PATH', realpath(dirname(__FILE__)));

function my_autoload( $class ) {
    $class = str_replace("_","/");    
    include( $class . '.php' );
}
spl_autoload_register('my_autoload');

function WriteLog($s) {
	//echo "<pre>$s<br/></pre>";
	//echo "$s\n";
	error_log(date('Y-m-d H:i:s')." $s\n",3,APPLICATION_PATH."/report.log");
}

