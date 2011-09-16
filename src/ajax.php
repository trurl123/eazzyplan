<?php

require 'init.php';

$ajax = new AjaxController();
$ajax->run();

class AjaxController {

    const PLAN_ID_LENGTH = 6;
    public $plansDir;
    
    public function run() {
        $this->plansDir = APPLICATION_PATH . "/plans";
        $result = new stdClass();
        try {
            $action = $_POST['action'];
            $result->result = call_user_func(array($this, $action));
            $result->ok = 1;
        } catch (Exception $e) {
            $result->error = $e->getMessage();
        }
        echo json_encode($result);
    }

    public function getPlan() {
        $id = $_POST['id'];
        $id = preg_replace('/[^a-z]/i','',$id);
        $planPath = $this->plansDir . "/" . $id;
        if (!file_exists($planPath . ".user")) {
            $own = 0;
        } else {
            $userid = file_get_contents($planPath . ".user");
            $own = ($userid == $_POST['userid']) ? 1 : 0;
        }
        return $own . file_get_contents($planPath);
    }

    public function createPlan() {
        if (!file_exists($this->plansDir)) {
            mkdir($this->plansDir);
        }
        $id = $this->genPlanId();
        $planPath = $this->plansDir . "/" . $id;
        file_put_contents($planPath . ".user", $_POST['userid']);
        file_put_contents($planPath, $_POST['plan']);
        return $id;
    }

    public function savePlan() {
        if (!file_exists($this->plansDir)) {
            return 0;
        }
        $id = $_POST['id'];
        $planPath = $this->plansDir . "/" . $id;
        $userid = file_get_contents($planPath . ".user");
        $own = ($userid == $_POST['userid']) ? 1 : 0;
        if (!$own) {
            throw new Exception("You do not own this plan");
        }
        if (file_exists($planPath)) {
            if ($_POST['plan']) {
                file_put_contents($planPath, $_POST['plan']);
            } else {
                throw new Exception("Application error. Saving empty plan");
            }
            return 1;
        } else {
            throw new Exception("Plan does not exist");
            return 0;
        }
    }

    private function genPlanId() {
        for ($i=0; $i<1000; $i++) {
            $id = generate_random_letters(self::PLAN_ID_LENGTH);
            //WriteLog('id='.$id);
            $planPath = $this->plansDir . "/" . $id;
            if (!file_exists($planPath)) {
                break;
            }
        }
        return $id;
    }
}

function generate_random_letters($length) {
    $random = '';
    for($i = 0; $i < $length; $i++) {
        $c = chr(rand(ord('a'), ord('z')));
        if(rand(0, 1) == 0) {
            $c = strtoupper($c);
        }
        $random .= $c;
    }
    return $random;
}
