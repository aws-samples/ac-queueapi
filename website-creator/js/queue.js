
var credentials;
var secretKey;
var accessKey;
var sessionId;
var connect;
var qcList;
var selectedQC;
var selectedId;
var queueList;
var cfList;
var hopList;
var phoneList;
var quickConnectList;
var timerID;
var dlgSourceAccessKey, dlgSourceSecretKey, dlgSourceRegion, dlgInstanceId;
const GCREATE = 'CREATE';
const GMODIFY = 'MODIFY';
const GVOICE = 'VOICE';
const GCHAT = 'CHAT';
const GSTANDARD = 'STANDARD';

// allowed will be CREATE and MODIFY
var currentOperation = GCREATE;

$( document ).ready(function() {
    if (!checkCookie()) {
        setAWSConfig(dlgSourceAccessKey, dlgSourceSecretKey, dlgSourceRegion);
        setupAll();
    } else {
        setupAll();
        $( "#configDialog" ).dialog( "open" );
    }
});

function setupAll() {
    loadConnectAPIs();
    $( "#createTabs" ).tabs();
    $("#modifyQC").click(() => {
        currentOperation=GMODIFY;
        clear_form_elements('#qcForm');
        $("#btnCreate").hide();
        $("#btnRename").show();
        $("#btnUpdateHoursOfOperation").show();        
        $("#btnUpdateOutboundConfig").show();
        $("#btnUpdateMaxContacts").show();
        $("#btnUpdateStatus").show();
        $("#qcStatus").show();
        $("#queueStatus").show();
        $( "#qcDialog" ).dialog( "open" );
        modifyQC(selectedId);
    });
    
        
    $("#listQC").click(() => {
        getAllQueues();
    });
    
    $("#btnDescribeHOP").click(() => {
        getHoursOfOperations();
    });
    
    
    $("#createQC").click(() => {
        currentOperation=GCREATE;
        clear_form_elements('#qcForm');
        $("#btnCreate").show();
        $("#btnRename").hide();
        $("#btnUpdateHoursOfOperation").hide();        
        $("#btnUpdateOutboundConfig").hide();
        $("#btnUpdateMaxContacts").hide();
        $("#btnUpdateStatus").hide();
        $("#qcStatus").hide();
        $("#queueStatus").hide();
        populateContactFlow("OUTBOUND_WHISPER", "1");
        populatePhoneNumber("1");
        populateHoursOfOperation("1");
        $( "#qcDialog" ).dialog( "open" );
    });
    
    $("#describeQC").click(() => {
        describeQC(selectedId);
    });
    
    $("#btnRename").click(() => {
    	updateQueueNameDesc();
    });
    
    $("#btnUpdateHoursOfOperation").click(() => {
        updateQueueHoursOfOps();
    });
    
    $("#btnUpdateOutboundConfig").click(() => {
    	updateQueueOBConfig();
    });
    
    $("#btnUpdateMaxContacts").click(() => {
    	updateQueueContactsMax();
    });

    $("#btnUpdateStatus").click(() => {
    	updateQueueStatusEnableDisable();
    });
    
    
        
    $("#btnCreate").click(() => {
        createQC();
        $( "#qcDialog" ).dialog( "close" );
    });
    
    $("#awsConfiguration").click(() => {
        $( "#configDialog" ).dialog( "open" );
    });
    
    $("#btnConfiguration").click(() => {
        if (saveCookie()) {
            $( "#configDialog" ).dialog( "close" );
        } else {
            $( "#configDialog" ).dialog( "open" );
        }
    });
       
    $("#dialog").dialog({
        autoOpen: false,
        modal: true
      });
    
    $("#qcDialog").dialog({
        autoOpen: false,
        width: 1100,
        modal: true,
        resizable: false,
        height: "auto"        
        
    });
    
    $("#resultDialog").dialog({
        autoOpen: false,
        modal: true
    });

    
    $('#describeHOPDialog').dialog({
        autoOpen: false,
        width: 850,
        modal: true,
        resizable: false,
        height: "auto"        
    });
    
    $('#configDialog').dialog({
        autoOpen: false,
        width: 850,
        modal: true,
        resizable: false,
        height: "auto"        
    });

    $( "#confirmDialog" ).dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
          "Yes": function() {
            $( this ).dialog( "close" );
          },
          Cancel: function() {
            $( this ).dialog( "close" );
          }
        }
    });
    $( "#addQuickConnectDialog" ).dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
          "Add": function() {
            $( this ).dialog( "close" );
            addQuickConnect();
          },
          Cancel: function() {
            $( this ).dialog( "close" );
          }
        }
    });        
    
    
    qcListTable = $('#qcListTable').DataTable({
        columnDefs: [
            {
                targets: -1,
                className: 'dt-body-right'
            }
          ],        
        columns: [{title: "Name"},{title: "Type"}],
        select: true,
        paging: false,
        info: false,
        searching: false
    });
    
    qcListTable.on( 'select', function ( e, dt, type, indexes ) {
        if ( type === 'row' ) {
            selectedQC = qcListTable.rows( indexes ).data()[0][0];
            $('#selectedQC').val(selectedQC);
            for (var i=0; i< queueList.QueueSummaryList.length; i++) {
                if (selectedQC === queueList.QueueSummaryList[i].Name) {
                    selectedId = queueList.QueueSummaryList[i].Id;
                    break;
                }
            }
        }
    });
    
    getAllQueues();
        
}


async function addQuickConnect() {
	try{
		var qc = [];
		qc.push($("#sltQuickConnect").val());
		
		if(currentOperation ===GMODIFY){
			let resp = await associateQueueQuickConnects(dlgInstanceId, selectedId, qc);
			fillQuickConnectTable();
		}else{
			var tbody = $('#tblQuickConnects').children('tbody');
			var table = tbody.length ? tbody : $('#tblQuickConnects');
			var qName = $( "#sltQuickConnect option:selected" ).text();
			var a = '<a href="" onclick="removeQuickConnect(\'-\',\'' + qName + '\');return false;">Remove</>';
			table.append("<tr><td>" + qName + "</td><td>" + a +"</td</tr>");			
		}
	}catch(e){
		console.log(e);
		showResults(e);
	}
}

async function removeQuickConnect(qcId, qName){
	try{
		if(currentOperation ===GMODIFY){
			var qc = [];
			qc.push(qcId);
			let resp = await disassociateQueueQuickConnects(dlgInstanceId, selectedId, qc);
			fillQuickConnectTable();
		}else{
			removeRowFromTable("#tblQuickConnects", qName);
		}
	}catch(e){
		console.log(e);
		showResults(e);
		
	}
	 	
}

async function fillQuickConnectTable(){
	try{
		let resp = await listQueueQuickConnects(dlgInstanceId, selectedId);
		console.log(resp);
		$("#tblQuickConnects").empty();
		var tbody = $('#tblQuickConnects').children('tbody');
		var table = tbody.length ? tbody : $('#tblQuickConnects');
		table.append("<tr><th>Quick Connect</th><th>Remove</th></tr>");
		for(var i=0; i<resp.QuickConnectSummaryList.length; i++){
			var item = resp.QuickConnectSummaryList[i];
			var a = '<a href="" onclick="removeQuickConnect(\'' + item.Id + '\',\'' + item.Name + '\');return false;">Remove</>';
			table.append("<tr><td>" + item.Name + "</td><td>" + a +"</td</tr>");			
		}
	}catch(e){
		console.log(e);
		handleWindow(false,'');
		showResults(e);
	}
	
}

function removeRowFromTable(ele, searchString){
	var indexFind =0;
	$(ele + " tr").each(function(parentIndex) {
		//var val1 = $(t.rows[i].cells[0]).text();
		$(this).find('td').each (function(index) {
			  if(index == 0){
				  var str = $(this).text();
				  if(searchString.localeCompare(str)==0){
					  indexFind = parentIndex+1;
				  }
			  }
		});
		if(indexFind > 0){
			$(this).remove();
			indexFind =0;
		}
	});
}

function showAddQuickConnectDialog() {
	$('#sltQuickConnect').empty();
    for(var i=0; i < quickConnectList.QuickConnectSummaryList.length; i++){
    	var j = quickConnectList.QuickConnectSummaryList[i];
 		$('#sltQuickConnect').append('<option selected value="' +  j.Id + '">' + j.Name +'</option>');
    }
	
    $( "#addQuickConnectDialog" ).dialog( "open" );
}

async function createQC() { 
	try {
		handleWindow(true, '');
		var name = $('#qcName').val();
		var description = $('#qcDescription').val();
		var hop = $('#qcHoursOfOperationId').val();
		var occ = {};
		var cidName = $('#qcOutboundCallerIdName').val();
		var cidNumId = $('#qcOutboundCallerIdNumberId').val();
		var cidFlowId = $('#qcOutboundFlowId').val();
		occ['OutboundCallerIdName'] = cidName.isEmpty() ? null : cidName;
		occ['OutboundCallerIdNumberId'] = cidNumId === '-' ? null : cidNumId;	
		occ['OutboundFlowId'] = cidFlowId === '-' ? null : cidFlowId;
		var max = $('#qcMaxContacts').val();
		max = max.isEmpty() ? "0" : max;
		var status;
		if ($('#qcStatus').is(':checked')) {
			status = 'ENABLED'
		} else {
			status = 'DISABLED'
		}
		var qc = [];
		var table = document.getElementById("tblQuickConnects");
		for (var i = 0, row; row = table.rows[i]; i++) {
		  for (var j = 0, col; col = row.cells[j]; j++) {
			  if(j==0){
				  if(i>0){
					  qc.push(getQuickConnectId(col.innerText));
				  }
					  
			  }
		  }
		}
		
		let resp = await createQueue (dlgInstanceId, name, description, occ, hop, max, qc);
		handleWindow(false, '');
		getAllQueues();
	} catch (e) {		
		console.log(e);
		handleWindow(false, '');
	}
	
}

function getQuickConnectId(qcName) {
	
	for(var i=0; i<quickConnectList.QuickConnectSummaryList.length; i++){
		var item = quickConnectList.QuickConnectSummaryList[i];
		if(qcName === item.Name)
			return item.Id;
	}
	
}

async function updateQueueNameDesc() {
	try {
		handleWindow(true, '');
		var name = $('#qcName').val();
		var description = $('#qcDescription').val();
		let resp = await updateQueueName(dlgInstanceId, selectedId, name, description);
		console.log(resp);
		handleWindow(false, '');
		modifyQC(selectedId);
	} catch (e) {		
		console.log(e);
		handleWindow(false, '');
	}
}

async function updateQueueHoursOfOps() {
	try {
		handleWindow(true, '');
		var hop = $('#qcHoursOfOperationId').val();
		let resp = await updateQueueHoursOfOperation(dlgInstanceId, selectedId, hop);
		console.log(resp);
		handleWindow(false, '');
		modifyQC(selectedId);
	} catch (e) {		
		console.log(e);
		handleWindow(false, '');
	}
	
}

async function updateQueueOBConfig() {
	try {
		handleWindow(true, '');
		var occ = {};
		var cidName = $('#qcOutboundCallerIdName').val();
		var cidNumId = $('#qcOutboundCallerIdNumberId').val();
		var cidFlowId = $('#qcOutboundFlowId').val();
		occ['OutboundCallerIdName'] = cidName.isEmpty() ? null : cidName;
		occ['OutboundCallerIdNumberId'] = cidNumId === '-' ? null : cidNumId;	
		occ['OutboundFlowId'] = cidFlowId === '-' ? null : cidFlowId;
		let resp = await updateQueueOutboundCallerConfig(dlgInstanceId, selectedId, occ);
		console.log(resp);
		handleWindow(false, '');
		modifyQC(selectedId);
	} catch (e) {		
		console.log(e);
		handleWindow(false, '');
	}
	
}


async function updateQueueContactsMax() {
	try {
		handleWindow(true, '');
		var max = $('#qcMaxContacts').val();
		let resp = await updateQueueMaxContacts(dlgInstanceId, selectedId, max);
		console.log(resp);
		handleWindow(false, '');
		modifyQC(selectedId);
	} catch (e) {		
		console.log(e);
		handleWindow(false, '');
	}
	
}

async function updateQueueStatusEnableDisable() {
	try {
		handleWindow(true, '');
		var status;
		if ($('#qcStatus').is(':checked')) {
			status = 'ENABLED'
		} else {
			status = 'DISABLED'
		}
		let resp = await updateQueueStatus(dlgInstanceId, selectedId, status);
		console.log(resp);
		handleWindow(false, '');
		modifyQC(selectedId);
	} catch (e) {		
		console.log(e);
		handleWindow(false, '');
	}
	
}

async function modifyQC() {
    try {
        handleWindow(true, '');
        var resp = await describeQueue(dlgInstanceId, selectedId);
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        $('#qcName').val(resp.Queue.Name);
        $('#qcDescription').val(resp.Queue.Description);
        $('#qcMaxContacts').val(resp.Queue.MaxContacts);
        if(resp.Queue.OutboundCallerConfig) {
            $('#qcOutboundCallerIdName').val(resp.Queue.OutboundCallerConfig.OutboundCallerIdName);
            populateContactFlow('OUTBOUND_WHISPER', resp.Queue.OutboundCallerConfig.OutboundFlowId);
            populatePhoneNumber(resp.Queue.OutboundCallerConfig.OutboundCallerIdNumberId);
        }
        populateHoursOfOperation(resp.Queue.HoursOfOperationId);
        if(resp.Queue.Status === 'ENABLED') {
        	$('#qcStatus').prop('checked', true);
        	$('#queueStatus').text('Enabled');
        } else {
        	$('#qcStatus').prop('checked', false);
        	$('#queueStatus').text('Disabled');
        }
        fillQuickConnectTable();
        console.log(resp);
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
	
}

 
function populateContactFlow(flowType, selectId) {
	$('#qcOutboundFlowId').empty();
	$('#qcOutboundFlowId').append('<option value="-">-</option>');
    for(var i=0; i < cfList.ContactFlowSummaryList.length; i++){
    	var j = cfList.ContactFlowSummaryList[i];
    	
    	if(j.ContactFlowType === flowType) {
    		if(j.Id == selectId) {
    			$('#qcOutboundFlowId').append('<option selected value="' +  j.Id + '">' + j.Name +'</option>');
    		} else {
    			$('#qcOutboundFlowId').append('<option value="' +  j.Id + '">' + j.Name +'</option>');	
    		}
    		
    	}
    }
}

function populatePhoneNumber(selectId) {
	$('#qcOutboundCallerIdNumberId').empty();
	$('#qcOutboundCallerIdNumberId').append('<option value="-">-</option>');
    for(var i=0; i < phoneList.PhoneNumberSummaryList.length; i++){
    	var j = phoneList.PhoneNumberSummaryList[i];
    		if(j.Id == selectId) {
    			$('#qcOutboundCallerIdNumberId').append('<option selected value="' +  j.Id + '">' + j.PhoneNumber +'</option>');
    		} else {
    			$('#qcOutboundCallerIdNumberId').append('<option value="' +  j.Id + '">' + j.PhoneNumber +'</option>');	
    		}
    }
}

function populateHoursOfOperation(selectId) {
	$('#qcHoursOfOperationId').empty();
    for(var i=0; i < hopList.HoursOfOperationSummaryList.length; i++){
    	var j = hopList.HoursOfOperationSummaryList[i];
    		if(j.Id == selectId) {
    			$('#qcHoursOfOperationId').append('<option selected value="' +  j.Id + '">' + j.Name +'</option>');
    		} else {
    			$('#qcHoursOfOperationId').append('<option value="' +  j.Id + '">' + j.Name +'</option>');	
    		}
    }
}

async function describeQC() {
    try {
        handleWindow(true, '');
        var resp = await describeQueue(dlgInstanceId, selectedId);
        console.log(resp);
        formatJSON(resp, '#rpFormatted');
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
}
function formatHoursMinutes(hoursMinutes) {
	if(hoursMinutes <= 9) {
		return '0' + hoursMinutes; 
	} else {
		return hoursMinutes;
	}
}
async function getHoursOfOperations() {
	try{
		var hopID = $('#qcHoursOfOperationId').val();
		let resp = await describeHoursOfOperation(dlgInstanceId, hopID);
		console.log(resp);
		$( "#spnHOPName").text(resp.HoursOfOperation.Name); 
		$( "#spnHOPDescription").text(resp.HoursOfOperation.Description);
		$( "#spnHOPTZ").text(resp.HoursOfOperation.TimeZone);
		for(var i = 0; i < resp.HoursOfOperation.Config.length; i ++) {
			var j = resp.HoursOfOperation.Config[i];
			if(j.Day === 'SUNDAY') {
				$('#spnSundayStart').text(formatHoursMinutes(j.StartTime.Hours) + ':' + formatHoursMinutes(j.StartTime.Minutes));
				$('#spnSundayEnd').text(formatHoursMinutes(j.EndTime.Hours) + ':' + formatHoursMinutes(j.EndTime.Minutes));
			}
			if(j.Day === 'MONDAY') {
				$('#spnMondayStart').text(formatHoursMinutes(j.StartTime.Hours) + ':' + formatHoursMinutes(j.StartTime.Minutes));
				$('#spnMondayEnd').text(formatHoursMinutes(j.EndTime.Hours) + ':' + formatHoursMinutes(j.EndTime.Minutes));
			}
			if(j.Day === 'TUESDAY') {
				$('#spnTuesdayStart').text(formatHoursMinutes(j.StartTime.Hours) + ':' + formatHoursMinutes(j.StartTime.Minutes));
				$('#spnTuesdayEnd').text(formatHoursMinutes(j.EndTime.Hours) + ':' + formatHoursMinutes(j.EndTime.Minutes));
			}
			if(j.Day === 'WEDNESDAY') {
				$('#spnWednesdayStart').text(formatHoursMinutes(j.StartTime.Hours) + ':' + formatHoursMinutes(j.StartTime.Minutes));
				$('#spnWednesdayEnd').text(formatHoursMinutes(j.EndTime.Hours) + ':' + formatHoursMinutes(j.EndTime.Minutes));
			}
			if(j.Day === 'THURSDAY') {
				$('#spnThursdayStart').text(formatHoursMinutes(j.StartTime.Hours) + ':' + formatHoursMinutes(j.StartTime.Minutes));
				$('#spnThursdayEnd').text(formatHoursMinutes(j.EndTime.Hours) + ':' + formatHoursMinutes(j.EndTime.Minutes));
			}
			if(j.Day === 'FRIDAY') {
				$('#spnFridayStart').text(formatHoursMinutes(j.StartTime.Hours) + ':' + formatHoursMinutes(j.StartTime.Minutes));
				$('#spnFridayEnd').text(formatHoursMinutes(j.EndTime.Hours) + ':' + formatHoursMinutes(j.EndTime.Minutes));
			}
			if(j.Day === 'SATURDAY') {
				$('#spnSaturdayStart').text(formatHoursMinutes(j.StartTime.Hours) + ':' + formatHoursMinutes(j.StartTime.Minutes));
				$('#spnSaturdayEnd').text(formatHoursMinutes(j.EndTime.Hours) + ':' + formatHoursMinutes(j.EndTime.Minutes));
			}
			
		}
        $( "#describeHOPDialog" ).dialog( "open" );
		formatJSON(resp, '#rpFormatted');
	}catch(e){
		console.log(e);
		showResults(e);
		
	}
}


async function getAllQueues() {
    try {
        handleWindow(true, '');
        queueList = await listQueues(dlgInstanceId);
        console.log(queueList);

        formatJSON(queueList, '#rpFormatted');
        qcListTable.clear();
        for (var i=0; i< queueList.QueueSummaryList.length; i++) {
            var value = queueList.QueueSummaryList[i];
            if(value.QueueType === 'STANDARD') {
            	qcListTable.row.add([value.Name, value.QueueType]);
            }
            	
        }
        qcListTable.draw();

        cfList = await listContactFlows(dlgInstanceId);
        console.log(cfList);
        hopList = await listHoursOfOperations(dlgInstanceId);
        console.log(hopList);
        phoneList = await listPhoneNumbers(dlgInstanceId);
        console.log(phoneList);
        quickConnectList = await listQuickConnects(dlgInstanceId);
        console.log(quickConnectList);
        handleWindow(false, '');
    } catch(e) {
        console.log(e);        
        handleWindow(false, '');
        showResults(e);
    }
    
}


const describeHoursOfOperation = (instanceId, hoursOfOperationId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, HoursOfOperationId : hoursOfOperationId};       
           console.log(params);
           connect.describeHoursOfOperation(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const disassociateQueueQuickConnects = (instanceId, queueId, quickConnects) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId, QuickConnectIds : quickConnects};       
           console.log(params);
           connect.disassociateQueueQuickConnects(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const associateQueueQuickConnects = (instanceId, queueId, quickConnects) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId, QuickConnectIds : quickConnects};       
           console.log(params);
           connect.associateQueueQuickConnects(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const createQueue = (instanceId, name, description, outboundCallerConfig, hoursOfOperationId, maxContacts, quickConnects) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, Name : name, Description : description, OutboundCallerConfig : outboundCallerConfig, 
        		   HoursOfOperationId : hoursOfOperationId, MaxContacts : maxContacts, QuickConnectIds : quickConnects};       
           console.log(params);
           connect.createQueue(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listQueueQuickConnects = (instanceId, queueId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId};       
           console.log(params);
           connect.listQueueQuickConnects(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }


const updateQueueStatus = (instanceId, queueId, status) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId, Status : status};       
           console.log(params);
           connect.updateQueueStatus(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const updateQueueMaxContacts = (instanceId, queueId, maxContacts) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId, MaxContacts : maxContacts};       
           console.log(params);
           connect.updateQueueMaxContacts(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const updateQueueOutboundCallerConfig = (instanceId, queueId, outboundCallerConfig) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId, OutboundCallerConfig : outboundCallerConfig};       
           console.log(params);
           connect.updateQueueOutboundCallerConfig(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const updateQueueHoursOfOperation = (instanceId, queueId, hoursOfOperationId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId, HoursOfOperationId : hoursOfOperationId};       
           console.log(params);
           connect.updateQueueHoursOfOperation(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const updateQueueName = (instanceId, queueId, name, description) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId, Name : name, Description : description};       
           console.log(params);
           connect.updateQueueName(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }


const describeQueue = (instanceId, queueId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId, QueueId : queueId};       
           console.log(params);
           connect.describeQueue(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listQueues = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listQueues(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listContactFlows = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listContactFlows(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listHoursOfOperations = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listHoursOfOperations(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listQuickConnects = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listQuickConnects(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }

const listPhoneNumbers = (instanceId) => {
    return new Promise((resolve,reject) => {
           var params = {InstanceId : instanceId};       
           console.log(params);
           connect.listPhoneNumbers(params, function (err, res) {        
                if (err) 
                     reject(err);
                 else 
                    resolve(res);
            });
        });
    }


function showResults(message){
    $('#resultSpan').text(message);
    $("#resultDialog").dialog("open");
}

function loadConnectAPIs() {
	connect = new AWS.Connect({ region: dlgSourceRegion});
}


function handleWindow(openClose, text) {
    if(openClose == true) {
        $( "#dialog" ).dialog( "open" );
    } else {
        $( "#dialog" ).dialog( "close" );
    }

    if(text.length>1) {
        $('#waitingSpan').text(text);
    } else {
        $('#waitingSpan').text('    Waiting for server to respond');
    }
}

function setAWSConfig(accessKey, secretKey, rgn) {

    AWS.config.update({
        accessKeyId: accessKey, secretAccessKey: secretKey, region: rgn
    });    
    AWS.config.credentials.get(function (err) {
        if (err)
            console.log(err);
        else {
            credentials = AWS.config.credentials;
            getSessionToken();
        }
    });
    
}

function formatJSON(data, element) {
    $(element).html(prettyPrintJson.toHtml(data));
}


function getSessionToken() {
    var sts = new AWS.STS();
    sts.getSessionToken(function (err, data) {
      if (err) console.log("Error getting credentials");
      else {
          secretKey = data.Credentials.SecretAccessKey;
          accessKey = data.Credentials.AccessKeyId;
          sessionId = data.Credentials.SessionToken;
      }
    });
}

function clear_form_elements(ele) {
    $(':input',ele)
      .not(':button, :submit, :reset')
      .val('')
      .prop('checked', false)
      .prop('selected', false);
}

function saveCookie() {
    dlgSourceAccessKey=$("#dlgSourceAccessKey").val();
    dlgSourceSecretKey=$("#dlgSourceSecretKey").val();
    dlgSourceRegion=$("#dlgSourceRegion").val();
    dlgInstanceId = $("#dlgInstanceId").val();
    if(!checkAllMandatoryFields()) {
        setCookie("dlgSourceAccessKey", dlgSourceAccessKey,100);
        setCookie("dlgSourceSecretKey", dlgSourceSecretKey,100 );
        setCookie("dlgSourceRegion", dlgSourceRegion,100);
        setCookie("dlgInstanceId", dlgInstanceId,100);
        $('#spnAWSMessage').text('');
        setAWSConfig(dlgSourceAccessKey, dlgSourceSecretKey, dlgSourceRegion);
        return true;
    }else{
        $('#spnAWSMessage').text('All fields are mandatory and cannot be whitespaces or null');        
        return false;
    }
}

function getCookie(c_name)
{
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++)
    {
      x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
      y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
      x=x.replace(/^\s+|\s+$/g,"");
      if (x===c_name)
        {
          return unescape(y);
        }
     }
}

function setCookie(c_name,value,exdays)
{
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
}

function checkCookie()
{
    dlgSourceAccessKey=getCookie("dlgSourceAccessKey");
    dlgSourceSecretKey=getCookie("dlgSourceSecretKey");
    dlgSourceRegion=getCookie("dlgSourceRegion");
    dlgInstanceId=getCookie("dlgInstanceId");
    $('#dlgSourceAccessKey').val(dlgSourceAccessKey);
    $('#dlgSourceSecretKey').val(dlgSourceSecretKey);
    $('#dlgSourceRegion').val(dlgSourceRegion);
    $('#dlgInstanceId').val(dlgInstanceId);
    
    return checkAllMandatoryFields();
}

function checkAllMandatoryFields() {
    if(isBlank(dlgSourceAccessKey) || dlgSourceAccessKey.isEmpty() || 
            isBlank(dlgSourceSecretKey) || dlgSourceSecretKey.isEmpty() || 
            isBlank(dlgSourceRegion) || dlgSourceRegion.isEmpty() ||
            isBlank(dlgInstanceId) || dlgInstanceId.isEmpty()
            ) {
        return true;
    }else
        return false;
}

function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}

String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};