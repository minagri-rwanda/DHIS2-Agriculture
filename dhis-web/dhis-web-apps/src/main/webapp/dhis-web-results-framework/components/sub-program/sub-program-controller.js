/* global resultsFramework */

//Controller for the header section
resultsFramework.controller('SubProgramController',
        function($scope,
                $modalInstance,
                DialogService,
                ModalService,
                selectedProgram,
                selectedSubProgram,
                operationMode,
                outputIndicatorGroups,
                outputDataSets,
                //programs,
                //resultsFrameworks,
                SubProgramFactory,
                MetaAttributesFactory,
                RfUtils) {
    
    $scope.fileNames = [];
    $scope.subProgramForm = {submitted: false};
    $scope.selectedProgram = selectedProgram;                
    $scope.operationMode = operationMode;
    $scope.model = {    showAddSubProgramDiv: false,
                        showEditSubProgramDiv: false,
                        selectSize: 20,
                        outputDataSets: outputDataSets,                        
                        outputIndicatorGroups: outputIndicatorGroups,
                        metaAttributes: [],
                        metaAttributesById: [],
                        metaAttributeValues: {}
                    };
                    
    if( selectedSubProgram && selectedSubProgram.id ){        
        SubProgramFactory.get(selectedSubProgram.id).then(function(sp){
            $scope.model.selectedSubProgram = sp;
            $scope.model.selectedSubProgram.outputs = sp.outputs ? sp.outputs : [];
            $scope.model.selectedSubProgram.dataSets = sp.dataSets ? sp.dataSets : [];
            $scope.model.selectedSubProgram.attributeValues = sp.attributeValues ? sp.attributeValues : [];
            $scope.model.metaAttributeValues = {};
            
            $scope.model.metaAttributeValues = RfUtils.processMetaAttributeValues($scope.model.selectedSubProgram, $scope.model.metaAttributeValues, $scope.model.metaAttributesById);
            
            RfUtils.getFileNames($scope.model.selectedSubProgram, $scope.model.metaAttributesById).then(function(res){
                $scope.fileNames = res;
            });
        });
    }
    else{
        $scope.model.selectedSubProgram = {programm: {id: $scope.selectedProgram.id}, outputs: [], dataSets: [], attributeValues: []};
    }    
            
    MetaAttributesFactory.getAttributesForObject( 'subProgrammAttribute' ).then(function(attributes){
        angular.forEach(attributes, function(att){
            $scope.model.metaAttributes.push( att );
            $scope.model.metaAttributesById[att.id] = att;
        });         
    });
        
    $scope.interacted = function(field, form) {
        var status = false;
        if(!form){
            return status;
        }
        if(field){            
            status = form['submitted'] || field.$dirty;
        }
        return status;        
    };
    
    $scope.addSubProgram = function(){
        
        //check for form validity
        $scope.subProgramForm.submitted = true;        
        if( $scope.subProgramForm.$invalid ){            
            return false;
        }
        
        $scope.model.selectedSubProgram.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);
        
        //form is valid, continue with adding
        SubProgramFactory.create($scope.model.selectedSubProgram).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'sub_program_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            else {
                
                //add the new program to the grid
                var sp = angular.copy($scope.model.selectedSubProgram);
                sp.id = data.response.lastImported;                
                $scope.selectedProgram.subProgramms.splice(0,0,sp);
                    
                //reset form
                $scope.close({program: $scope.selectedProgram, outputIndicatorGroups: $scope.model.outputIndicatorGroups, outputDataSets: $scope.model.outputDataSets});
            }
        });
    };
    
    $scope.updateSubProgram = function(){

        //check for form validity
        $scope.subProgramForm.submitted = true;        
        if( $scope.subProgramForm.$invalid ){
            return false;
        }
        
        $scope.model.selectedSubProgram.attributeValues = RfUtils.processMetaAttributes($scope.model.metaAttributes, $scope.model.metaAttributeValues);
        
        //form is valid, continue with adding
        SubProgramFactory.update($scope.model.selectedSubProgram).then(function(data){
            if (data.response.status === 'ERROR') {
                var dialogOptions = {
                    headerText: 'sub_program_saving_error',
                    bodyText: data.message
                };

                DialogService.showDialog({}, dialogOptions);
            }
            
            for(var i=0; i<$scope.selectedProgram.subProgramms.length; i++){
                if( $scope.selectedProgram.subProgramms[i].id === $scope.model.selectedSubProgram.id ){
                    $scope.selectedProgram.subProgramms[i] = $scope.model.selectedSubProgram;
                    break;
                }
            }

            //reset form              
            $scope.close({program: $scope.selectedProgram, outputIndicatorGroups: $scope.model.outputIndicatorGroups, outputDataSets: $scope.model.outputDataSets});
        });
    };
    
    $scope.deleteSubProgram = function(){
        var modalOptions = {
            closeButtonText: 'cancel',
            actionButtonText: 'delete',
            headerText: 'delete',
            bodyText: 'are_you_sure_to_delete'
        };

        ModalService.showModal({}, modalOptions).then(function(){            
            SubProgramFactory.delete($scope.model.selectedSubProgram).then(function(){                
                for(var i=0; i<$scope.selectedProgram.subProgramms.length; i++){
                    if( $scope.selectedProgram.subProgramms[i].id === $scope.model.selectedSubProgram.id ){                        
                        angular.forEach($scope.selectedProgram.subProgramms[i].outputs, function(op){
                            $scope.model.outputIndicatorGroups.push(op);
                        });
                        
                        angular.forEach($scope.selectedProgram.subProgramms[i].dataSets, function(ds){
                            $scope.model.outputDataSets.push(ds);
                        });
                        
                        $scope.selectedProgram.subProgramms.splice(i,1);    
                        break;
                    }
                }
                
                //reset form              
                $scope.close({program: $scope.selectedProgram, outputIndicatorGroups: $scope.model.outputIndicatorGroups, outputDataSets: $scope.model.outputDataSets});
                
            }, function(){
                var dialogOptions = {
                    headerText: 'error',
                    bodyText: 'delete_error'
                };
                DialogService.showDialog({}, dialogOptions);
            });
        });
    };
    
    $scope.close = function(obj){
        $modalInstance.close(obj);
    };
    
    $scope.deleteFile = function(attributeId){        
        RfUtils.deleteFile(attributeId, $scope.model.metaAttributeValues, $scope.fileNames).then(function(res){            
            $scope.model.metaAttributeValues = res.obj;
            $scope.fileNames = res.fileNames;            
            $scope.updateSubProgram();
        });
    };
});