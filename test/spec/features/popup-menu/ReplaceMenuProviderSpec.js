/* global sinon */

import {
  bootstrapModeler,
  getBpmnJS,
  inject
} from 'test/TestHelper';

import {
  createEvent as globalEvent
} from '../../../util/MockEvents';

import autoResizeModule from 'lib/features/auto-resize';
import coreModule from 'lib/core';
import customRulesModule from '../../../util/custom-rules';
import modelingModule from 'lib/features/modeling';
import replaceMenuProviderModule from 'lib/features/popup-menu';

import {
  query as domQuery,
  queryAll as domQueryAll,
  classes as domClasses
} from 'min-dom';

import { is } from 'lib/util/ModelUtil';

import { isExpanded } from 'lib/util/DiUtil';

var spy = sinon.spy;


describe('features/popup-menu - replace menu provider', function() {

  var diagramXMLMarkers = require('../../../fixtures/bpmn/draw/activity-markers-simple.bpmn'),
      diagramXMLReplace = require('../../../fixtures/bpmn/features/replace/01_replace.bpmn');

  var testModules = [
    coreModule,
    modelingModule,
    replaceMenuProviderModule,
    customRulesModule
  ];

  var openPopup = function(element, offset) {
    offset = offset || 100;

    getBpmnJS().invoke(function(popupMenu) {

      popupMenu.open(element, 'bpmn-replace', {
        x: element.x + offset, y: element.y + offset
      });

    });
  };


  describe('toggle', function() {

    beforeEach(bootstrapModeler(diagramXMLMarkers, { modules: testModules }));

    var toggleActive;

    beforeEach(inject(function(popupMenu) {
      toggleActive = function(entryCls) {
        return popupMenu._getEntry(entryCls).active;
      };
    }));


    describe('active attribute', function() {

      it('should be true for parallel marker', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('ParallelTask'),
            loopCharacteristics = task.businessObject.loopCharacteristics;

        // assume
        expect(loopCharacteristics.isSequential).to.be.false;
        expect(loopCharacteristics.isSequential).to.exist;

        // when
        openPopup(task);

        // then
        expect(is(loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).to.be.true;

        expect(toggleActive('toggle-parallel-mi')).to.be.true;
      }));


      it('should be true for sequential marker', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('SequentialTask'),
            loopCharacteristics = task.businessObject.loopCharacteristics;

        // assume
        expect(loopCharacteristics.isSequential).to.be.true;
        expect(is(loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).to.be.true;

        // when
        openPopup(task);

        // then
        expect(toggleActive('toggle-sequential-mi')).to.be.true;
      }));


      it('should be true for loop marker', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('LoopTask'),
            loopCharacteristics = task.businessObject.loopCharacteristics;

        // assume
        expect(loopCharacteristics.isSequential).not.to.exist;
        expect(is(loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).to.be.false;

        // when
        openPopup(task);

        // then
        expect(toggleActive('toggle-loop')).to.be.true;
      }));


      it('should be true for ad hoc marker', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var AdHocSubProcess = elementRegistry.get('AdHocSubProcess');

        // when
        openPopup(AdHocSubProcess);

        // then
        expect(toggleActive('toggle-adhoc')).to.be.true;
      }));

    });


    describe('exclusive toggle buttons', function() {

      it('should not toggle non exclusive buttons off', inject(function(popupMenu, bpmnReplace, elementRegistry) {
        var subProcess = elementRegistry.get('AdHocSubProcess');

        openPopup(subProcess);

        var entry = queryEntry('toggle-parallel-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(subProcess);

        // then
        var adHocEntry = queryEntry('toggle-adhoc');

        expect(domClasses(adHocEntry).has('active')).to.be.true;
      }));

    });


    describe('non exclusive toggle buttons', function() {

      it('should not toggle exclusive buttons off',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var subProcess = elementRegistry.get('SubProcess');

          // when

          // toggle parallel on
          openPopup(subProcess);

          var parallelEntry = queryEntry('toggle-parallel-mi');

          popupMenu.trigger(globalEvent(parallelEntry, { x: 0, y: 0 }));

          // toggle ad hoc on
          openPopup(subProcess);

          var adHocEntry = queryEntry('toggle-adhoc');

          var adHocSubProcess = popupMenu.trigger(globalEvent(adHocEntry, { x: 0, y: 0 }));

          openPopup(adHocSubProcess);

          // then
          parallelEntry = queryEntry('toggle-parallel-mi');
          adHocEntry = queryEntry('toggle-adhoc');

          expect(domClasses(parallelEntry).has('active')).to.be.true;
          expect(domClasses(adHocEntry).has('active')).to.be.true;
        })
      );

    });


    describe('parallel toggle button', function() {

      it('should toggle parallel marker off',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var task = elementRegistry.get('ParallelTask');

          openPopup(task);

          var entry = queryEntry('toggle-parallel-mi');

          // when
          popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

          openPopup(task);

          var parallelEntry = queryEntry('toggle-parallel-mi');

          // then
          expect(task.businessObject.loopCharacteristics).not.to.exist;
          expect(domClasses(parallelEntry).has('active')).to.be.false;
        })
      );


      it('should toggle parallel marker on', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('Task');

        openPopup(task);

        var entry = queryEntry('toggle-parallel-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var parallelEntry = queryEntry('toggle-parallel-mi');

        // then
        expect(domClasses(parallelEntry).has('active')).to.be.true;
        expect(task.businessObject.loopCharacteristics.isSequential).to.be.false;
        expect(is(task.businessObject.loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).to.be.true;
      }));


      it('should set sequential button inactive', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('SequentialTask');

        openPopup(task);

        var entry = queryEntry('toggle-parallel-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var sequentialEntry = queryEntry('toggle-sequential-mi');

        // then
        expect(domClasses(sequentialEntry).has('active')).to.be.false;
      }));


      it('should set loop button inactive', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('LoopTask');

        openPopup(task);

        var entry = queryEntry('toggle-parallel-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var loopEntry = queryEntry('toggle-loop');

        // then
        expect(domClasses(loopEntry).has('active')).to.be.false;
      }));

    });


    describe('sequential toggle button', function() {

      it('should toggle sequential marker off', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('SequentialTask');

        openPopup(task);

        var entry = queryEntry('toggle-sequential-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var sequentialEntry = queryEntry('toggle-sequential-mi');

        // then
        expect(task.businessObject.loopCharacteristics).not.to.exist;
        expect(domClasses(sequentialEntry).has('active')).to.be.false;
      }));


      it('should toggle sequential marker on', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('Task');

        openPopup(task);

        var entry = queryEntry('toggle-sequential-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var sequentialEntry = queryEntry('toggle-sequential-mi');

        // then
        expect(domClasses(sequentialEntry).has('active')).to.be.true;
        expect(task.businessObject.loopCharacteristics.isSequential).to.be.true;
        expect(is(task.businessObject.loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).to.be.true;
      }));


      it('should set loop button inactive', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('LoopTask');

        openPopup(task);

        var entry = queryEntry('toggle-sequential-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var loopEntry = queryEntry('toggle-loop');

        // then
        expect(domClasses(loopEntry).has('active')).to.be.false;
      }));


      it('should set parallel button inactive', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('ParallelTask');

        openPopup(task);

        var entry = queryEntry('toggle-sequential-mi');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var parallelEntry = queryEntry('toggle-parallel-mi');

        // then
        expect(domClasses(parallelEntry).has('active')).to.be.false;
      }));

    });


    describe('loop toggle button', function() {

      it('should toggle loop marker off', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('LoopTask');

        openPopup(task);

        var entry = queryEntry('toggle-loop');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var loopEntry = queryEntry('toggle-loop');

        // then
        expect(domClasses(loopEntry).has('active')).to.be.false;
        expect(is(task.businessObject.loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).not.to.exist;
      }));


      it('should toggle loop marker on', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('Task');

        openPopup(task);

        var entry = queryEntry('toggle-loop');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var loopEntry = queryEntry('toggle-loop');

        // then
        expect(domClasses(loopEntry).has('active')).to.be.true;
        expect(is(task.businessObject.loopCharacteristics, 'bpmn:StandardLoopCharacteristics')).to.be.true;
      }));


      it('should set sequential button inactive', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('SequentialTask');

        openPopup(task);

        var entry = queryEntry('toggle-loop');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var sequentialEntry = queryEntry('toggle-sequential-mi');

        // then
        expect(domClasses(sequentialEntry).has('active')).to.be.false;
      }));


      it('should set parallel button inactive', inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('ParallelTask');

        openPopup(task);

        var entry = queryEntry('toggle-loop');

        // when
        popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        openPopup(task);

        var parallelEntry = queryEntry('toggle-parallel-mi');

        // then
        expect(domClasses(parallelEntry).has('active')).to.be.false;
      }));
    });

  });


  describe('replacing', function() {

    beforeEach(bootstrapModeler(diagramXMLMarkers, { modules: testModules }));

    it('should retain the loop characteristics', inject(function(popupMenu, bpmnReplace, elementRegistry) {

      // given
      var task = elementRegistry.get('SequentialTask');

      openPopup(task);

      var entry = queryEntry('replace-with-send-task');

      // when
      // replacing the task with a send task
      var sendTask = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

      // then
      expect(sendTask.businessObject.loopCharacteristics).to.exist;
      expect(sendTask.businessObject.loopCharacteristics.isSequential).to.be.true;
      expect(is(sendTask.businessObject.loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).to.be.true;
    }));


    it('should retain the loop characteristics for call activites',
      inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var task = elementRegistry.get('SequentialTask');

        openPopup(task);

        var entry = queryEntry('replace-with-call-activity');

        // when
        // replacing the task with a call activity
        var callActivity = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        // then
        expect(callActivity.businessObject.loopCharacteristics).to.exist;
        expect(callActivity.businessObject.loopCharacteristics.isSequential).to.be.true;
        expect(is(callActivity.businessObject.loopCharacteristics, 'bpmn:MultiInstanceLoopCharacteristics')).to.be.true;
      })
    );


    it('should retain expanded status for sub processes',
      inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var subProcess = elementRegistry.get('SubProcess');

        openPopup(subProcess);

        var entry = queryEntry('replace-with-transaction');

        // when
        // replacing the expanded sub process with a transaction
        var transaction = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        // then
        expect(isExpanded(transaction)).to.equal(isExpanded(subProcess));
      })
    );


    it('should replace sub processes -> event sub process',
      inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var subProcess = elementRegistry.get('SubProcess');

        openPopup(subProcess);

        var entry = queryEntry('replace-with-event-subprocess');

        // when
        // replacing the expanded sub process with a eventSubProcess
        var eventSubProcess = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        // then
        expect(eventSubProcess.businessObject.triggeredByEvent).to.be.true;
      })
    );


    it('should replace event sub processes -> sub process',
      inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var eventSubProcess = elementRegistry.get('EventSubProcess');

        openPopup(eventSubProcess);

        var entry = queryEntry('replace-with-subprocess');

        // when
        // replacing the expanded sub process with a eventSubProcess
        var subProcess = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        // then
        expect(subProcess.businessObject.triggeredByEvent).to.be.false;
      })
    );


    it('should retain the loop characteristics and the expanded status for transactions',
      inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var transaction = elementRegistry.get('Transaction');

        openPopup(transaction);

        var entry = queryEntry('replace-with-subprocess');

        // when
        // replacing the transaction with an expanded sub process
        var subProcess = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        // then
        expect(isExpanded(subProcess)).to.equal(isExpanded(transaction));
      })
    );


    it('should not retain the loop characteristics morphing to an event sub process',
      inject(function(popupMenu, bpmnReplace, elementRegistry, modeling) {

        // given
        var transaction = elementRegistry.get('Transaction');

        modeling.updateProperties(transaction, { loopCharacteristics: { isparallel: true } });

        openPopup(transaction);

        var entry = queryEntry('replace-with-event-subprocess');

        // when
        // replacing the transaction with an event sub process
        var subProcess = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        // then
        expect(isExpanded(subProcess)).to.equal(isExpanded(transaction));
      })
    );


    it('should retain the expanded property morphing to an event sub processes',
      inject(function(popupMenu, bpmnReplace, elementRegistry) {

        // given
        var transaction = elementRegistry.get('Transaction');

        openPopup(transaction);

        var entry = queryEntry('replace-with-event-subprocess');

        // when
        // replacing the transaction with an expanded sub process
        var eventSubProcess = popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));

        // then
        expect(isExpanded(eventSubProcess)).to.equal(isExpanded(transaction));
      })
    );

  });


  describe('replace menu', function() {


    describe('events', function() {

      beforeEach(bootstrapModeler(diagramXMLReplace, { modules: testModules }));

      it('should contain all except the current one',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var startEvent = elementRegistry.get('StartEvent_1');

          // when
          openPopup(startEvent);

          // then
          expect(queryEntry('replace-with-none-start')).to.be.null;
          expect(queryEntries()).to.have.length(6);
        })
      );


      it('should contain all start events inside event sub process except the current one',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var startEvent = elementRegistry.get('StartEvent_3');

          // when
          openPopup(startEvent);

          // then
          expect(queryEntry('replace-with-non-interrupting-message-start')).to.be.null;
          expect(queryEntry('replace-with-message-start')).to.exist;

          expect(queryEntries()).to.have.length(11);
        })
      );


      it('should contain all non interrupting start events inside event sub process except the current one',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var startEvent = elementRegistry.get('StartEvent_3');

          var newElement = bpmnReplace.replaceElement(startEvent, {
            type: 'bpmn:StartEvent',
            eventDefinitionType: 'bpmn:ConditionalEventDefinition',
            isInterrupting: false
          });

          // when
          openPopup(newElement);

          // then
          expect(queryEntry('replace-with-conditional-start')).to.exist;
          expect(queryEntry('replace-with-non-interrupting-conditional-start')).to.be.null;

          expect(queryEntries()).to.have.length(11);
        })
      );


      it('should contain all intermediate events except the current one',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var intermediateEvent = elementRegistry.get('IntermediateThrowEvent_1');

          // when
          openPopup(intermediateEvent);

          // then
          expect(queryEntry('replace-with-none-intermediate-throw')).to.be.null;

          expect(queryEntries()).to.have.length(12);
        })
      );


      it('should contain all end events except the current one',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var endEvent = elementRegistry.get('EndEvent_1');

          // when
          openPopup(endEvent);

          // then
          expect(queryEntry('replace-with-none-end')).to.be.null;

          expect(queryEntries()).to.have.length(8);
        })
      );

    });


    describe('cancel events', function() {

      var diagramXML = require('../../../fixtures/bpmn/features/replace/cancel-events.bpmn');

      beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));

      it('should contain cancel event replace option',
        inject(function(elementRegistry) {

          // given
          var endEvent = elementRegistry.get('EndEvent_1');

          // when
          openPopup(endEvent);

          // then
          expect(queryEntries()).to.have.length(9);
        })
      );


      it('should NOT contain cancel event replace option',
        inject(function(elementRegistry) {

          // given
          var endEvent = elementRegistry.get('EndEvent_2');

          // when
          openPopup(endEvent);

          // then
          expect(queryEntries()).to.have.length(8);
        })
      );


      it('should contain cancel event replace option (boundary events)',
        inject(function(elementRegistry) {

          // given
          var boundaryEvent = elementRegistry.get('BoundaryEvent_1');

          // when
          openPopup(boundaryEvent);

          // then
          expect(queryEntries()).to.have.length(13);
        })
      );


      it('should NOT contain cancel event replace option (boundary events)',
        inject(function(elementRegistry) {

          // given
          var boundaryEvent = elementRegistry.get('BoundaryEvent_2');

          // when
          openPopup(boundaryEvent, 40);

          // then
          expect(queryEntries()).to.have.length(13);
        })
      );

    });


    describe('boundary events', function() {

      beforeEach(bootstrapModeler(diagramXMLReplace, { modules: testModules }));

      it('should contain all boundary events for an interrupting boundary event',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var boundaryEvent = elementRegistry.get('BoundaryEvent_1');

          // when
          openPopup(boundaryEvent, 40);

          // then
          expect(queryEntry('replace-with-conditional-intermediate-catch')).to.be.null;
          expect(queryEntries()).to.have.length(12);
        })
      );


      it('should contain all boundary events for a non interrupting boundary event',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var boundaryEvent = elementRegistry.get('BoundaryEvent_2');

          // when
          openPopup(boundaryEvent, 40);

          // then
          expect(queryEntry('replace-with-non-interrupting-message-intermediate-catch')).to.be.null;
          expect(queryEntries()).to.have.length(12);
        })
      );


      it('should contain compensation boundary event',
        inject(function(popupMenu, bpmnReplace, elementRegistry) {

          // given
          var boundaryEvent = elementRegistry.get('BoundaryEvent_1');

          // when
          openPopup(boundaryEvent, 40);

          // then
          expect(queryEntry('replace-with-compensation-boundary')).to.exist;
        })
      );

    });


    describe('default flows', function() {

      var diagramXML = require('./ReplaceMenuProvider.defaultFlows.bpmn');

      beforeEach(bootstrapModeler(diagramXML, {
        modules: testModules
      }));


      it('should show default replace option [gateway]', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_3');

        // when
        openPopup(sequenceFlow);

        // then
        expect(queryEntries()).to.have.length(1);
      }));


      it('should show Default replace option [task]', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn');

        // when
        openPopup(sequenceFlow);

        // then
        expect(queryEntries()).to.have.length(2);
      }));


      it('should NOT show default replace option', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_4');

        // when
        openPopup(sequenceFlow);

        // then
        expect(queryEntries()).to.have.length(0);
      }));

    });


    describe('default flows from inclusive gateways', function() {

      var diagramXML = require('./ReplaceMenuProvider.defaultFlowsFromInclusiveGateways.bpmn');

      beforeEach(bootstrapModeler(diagramXML, {
        modules: testModules
      }));


      it('should show default replace option', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_2');

        // when
        openPopup(sequenceFlow);

        var sequenceFlowEntry = queryEntry('replace-with-sequence-flow'),
            defaultFlowEntry = queryEntry('replace-with-default-flow');

        // then
        expect(sequenceFlowEntry).not.to.exist;
        expect(defaultFlowEntry).to.exist;
      }));


      it('should NOT show default replace option', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_1');

        // when
        openPopup(sequenceFlow);

        var sequenceFlowEntry = queryEntry('replace-with-sequence-flow'),
            defaultFlowEntry = queryEntry('replace-with-default-flow');

        // then
        expect(sequenceFlowEntry).to.exist;
        expect(defaultFlowEntry).not.to.exist;
      }));

    });


    describe('default flows from complex gateways', function() {

      var diagramXML = require('./ReplaceMenuProvider.defaultFlowsFromComplexGateways.bpmn');

      beforeEach(bootstrapModeler(diagramXML, {
        modules: testModules
      }));


      it('should show default replace option', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_2');

        // when
        openPopup(sequenceFlow);

        var sequenceFlowEntry = queryEntry('replace-with-sequence-flow'),
            defaultFlowEntry = queryEntry('replace-with-default-flow');

        // then
        expect(sequenceFlowEntry).not.to.exist;
        expect(defaultFlowEntry).to.exist;
      }));


      it('should NOT show default replace option', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_1');

        // when
        openPopup(sequenceFlow);

        var sequenceFlowEntry = queryEntry('replace-with-sequence-flow'),
            defaultFlowEntry = queryEntry('replace-with-default-flow');

        // then
        expect(sequenceFlowEntry).to.exist;
        expect(defaultFlowEntry).not.to.exist;
      }));

    });


    describe('conditional flows', function() {

      var diagramXML = require('./ReplaceMenuProvider.conditionalFlows.bpmn');

      beforeEach(bootstrapModeler(diagramXML, {
        modules: testModules
      }));


      it('should show ConditionalFlow replace option', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_3');

        // when
        openPopup(sequenceFlow);

        var conditionalFlowEntry = queryEntry('replace-with-conditional-flow');

        // then
        expect(conditionalFlowEntry).to.exist;

        expect(queryEntries()).to.have.length(2);
      }));


      it('should NOT show ConditionalFlow replace option', inject(function(elementRegistry) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_1');

        // when
        openPopup(sequenceFlow);

        // then
        expect(queryEntries()).to.have.length(0);
      }));

    });


    describe('compensate activities', function() {

      var diagramXML = require('./ReplaceMenuProvider.compensation-activity.bpmn');

      beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


      it('options should include subProcesses and callActivity', inject(function(elementRegistry) {

        // given
        var taskElement = elementRegistry.get('Task_1');

        // when
        openPopup(taskElement);

        var callActivityEntry = queryEntry('replace-with-call-activity'),
            subProcessEntry = queryEntry('replace-with-collapsed-subprocess');

        // then
        expect(callActivityEntry).to.exist;
        expect(subProcessEntry).to.exist;
      }));

    });

    describe('collapsed subprocesses', function() {

      var diagramXML = require('./ReplaceMenuProvider.collapsedSubProcess.bpmn');

      beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


      it('options do not include collapsed subprocesses itself', inject(function(elementRegistry) {

        // given
        var collapsedSubProcess = elementRegistry.get('Task_1');

        // when
        openPopup(collapsedSubProcess);

        var collapsedSubProcessEntry = queryEntry('replace-with-collapsed-subprocess');

        // then
        expect(collapsedSubProcessEntry).not.to.exist;
      }));

    });


  });


  describe('integration', function() {


    describe('default flows', function() {

      var diagramXML = require('./ReplaceMenuProvider.defaultFlows.bpmn');

      beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


      it('should replace SequenceFlow with DefaultFlow [gateway]', inject(function(elementRegistry, popupMenu) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_3');

        // when
        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-default-flow');

        var gateway = elementRegistry.get('ExclusiveGateway_1');

        // then
        expect(gateway.businessObject.default).to.equal(sequenceFlow.businessObject);
      }));


      it('should replace SequenceFlow with DefaultFlow [task]', inject(function(elementRegistry, popupMenu) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn');

        // when
        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-default-flow');

        var task = elementRegistry.get('Task_1ei94kl');

        // then
        expect(task.businessObject.default).to.equal(sequenceFlow.businessObject);
      }));


      it('should morph DefaultFlow into a SequenceFlow [task]', inject(function(elementRegistry, popupMenu) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn');

        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-default-flow');

        // when
        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-sequence-flow');

        var task = elementRegistry.get('Task_1ei94kl');

        // then
        expect(task.businessObject.default).not.to.exist;
      }));


      it('should morph DefaultFlow into a SequenceFlow [task] -> undo',
        inject(function(elementRegistry, popupMenu, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn');

          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-sequence-flow');

          commandStack.undo();

          var task = elementRegistry.get('Task_1ei94kl');

          // then
          expect(task.businessObject.default).to.equal(sequenceFlow.businessObject);
        })
      );


      it('should morph DefaultFlow into a ConditionalFlow [task]', inject(function(elementRegistry, popupMenu) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn'),
            task = elementRegistry.get('Task_1ei94kl');

        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-default-flow');

        // when
        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-conditional-flow');

        // then
        expect(task.businessObject.default).not.to.exist;
      }));


      it('should morph DefaultFlow into a ConditionalFlow [task] -> undo',
        inject(function(elementRegistry, popupMenu, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn'),
              task = elementRegistry.get('Task_1ei94kl');

          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-conditional-flow');

          commandStack.undo();

          // then
          expect(task.businessObject.default).to.equal(sequenceFlow.businessObject);
        })
      );


      it('should replace SequenceFlow with DefaultFlow [gateway] -> undo',
        inject(function(elementRegistry, popupMenu, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
              gateway = elementRegistry.get('ExclusiveGateway_1');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          commandStack.undo();

          // then
          expect(gateway.businessObject.default).not.to.exist;
        })
      );


      it('should replace SequenceFlow with DefaultFlow [task] -> undo',
        inject(function(elementRegistry, popupMenu, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          commandStack.undo();

          var task = elementRegistry.get('Task_1ei94kl');

          // then
          expect(task.businessObject.default).not.to.exist;
        })
      );


      it('should only have one DefaultFlow', inject(function(elementRegistry, popupMenu) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_1'),
            sequenceFlow3 = elementRegistry.get('SequenceFlow_3');


        // when
        // trigger morphing sequenceFlow3 to default flow
        openPopup(sequenceFlow3);

        triggerAction(popupMenu, 'replace-with-default-flow');

        // trigger morphing sequenceFlow to default flow
        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-default-flow');

        var gateway = elementRegistry.get('ExclusiveGateway_1');

        // then
        expect(gateway.businessObject.default).to.equal(sequenceFlow.businessObject);
      }));


      it('should replace DefaultFlow with SequenceFlow when changing source',
        inject(function(elementRegistry, popupMenu, modeling) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_1'),
              task = elementRegistry.get('Task_2');

          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          // when
          modeling.reconnectStart(sequenceFlow, task, [
            { x: 686, y: 267, original: { x: 686, y: 307 } },
            { x: 686, y: 207, original: { x: 686, y: 187 } }
          ]);

          var gateway = elementRegistry.get('ExclusiveGateway_1');

          // then
          expect(gateway.businessObject.default).not.to.exist;
        })
      );


      it('should replace DefaultFlow with SequenceFlow when changing source -> undo',
        inject(function(elementRegistry, popupMenu, modeling, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_1'),
              task = elementRegistry.get('Task_2');

          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          // when
          modeling.reconnectStart(sequenceFlow, task, [
            { x: 686, y: 267, original: { x: 686, y: 307 } },
            { x: 686, y: 207, original: { x: 686, y: 187 } }
          ]);

          commandStack.undo();

          var gateway = elementRegistry.get('ExclusiveGateway_1');

          // then
          expect(gateway.businessObject.default).equal(sequenceFlow.businessObject);
        })
      );


      [
        'bpmn:Activity',
        'bpmn:EndEvent',
        'bpmn:IntermediateThrowEvent',
        'bpmn:IntermediateCatchEvent'
      ].forEach(function(type) {

        it('should keep DefaultFlow when changing target to ' + type,
          inject(function(elementRegistry, elementFactory, canvas, popupMenu, modeling) {

            // given
            var sequenceFlow = elementRegistry.get('SequenceFlow_1'),
                root = canvas.getRootElement();

            var intermediateEvent = elementFactory.createShape({ type: type });

            modeling.createShape(intermediateEvent, { x: 686, y: 50 }, root);

            openPopup(sequenceFlow);

            triggerAction(popupMenu, 'replace-with-default-flow');

            // when
            modeling.reconnectEnd(sequenceFlow, intermediateEvent, [
              { x: 686, y: 267, original: { x: 686, y: 307 } },
              { x: 686, y: 50, original: { x: 686, y: 75 } }
            ]);

            var gateway = elementRegistry.get('ExclusiveGateway_1');

            // then
            expect(gateway.businessObject.default).to.exist;
          })
        );
      });


      it('should replace DefaultFlow with SequenceFlow when changing target -> undo',
        inject(function(elementRegistry, elementFactory, canvas, popupMenu, modeling, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_1'),
              rootElement = canvas.getRootElement();

          var intermediateEvent = elementFactory.createShape({ type: 'bpmn:StartEvent' });

          modeling.createShape(intermediateEvent, { x: 686, y: 50 }, rootElement);

          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          // when
          modeling.reconnectEnd(sequenceFlow, intermediateEvent, [
            { x: 686, y: 267, original: { x: 686, y: 307 } },
            { x: 686, y: 50, original: { x: 686, y: 75 } }
          ]);

          commandStack.undo();

          var gateway = elementRegistry.get('ExclusiveGateway_1');

          // then
          expect(gateway.businessObject.default).equal(sequenceFlow.businessObject);
        })
      );


      it('should keep DefaultFlow when morphing Gateway', inject(function(elementRegistry, popupMenu, bpmnReplace) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
            exclusiveGateway = elementRegistry.get('ExclusiveGateway_1');

        // when
        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-default-flow');

        var inclusiveGateway = bpmnReplace.replaceElement(exclusiveGateway, { type: 'bpmn:InclusiveGateway' });

        // then
        expect(inclusiveGateway.businessObject.default).to.equal(sequenceFlow.businessObject);
      }));


      it('should keep DefaultFlow when morphing Task', inject(
        function(elementRegistry, popupMenu, bpmnReplace) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_15f5knn'),
              task = elementRegistry.get('Task_1ei94kl');

          // when
          openPopup(sequenceFlow);

          // trigger DefaultFlow replacement
          triggerAction(popupMenu, 'replace-with-default-flow');

          var sendTask = bpmnReplace.replaceElement(task, { type: 'bpmn:SendTask' });

          // then
          expect(sendTask.businessObject.default).to.equal(sequenceFlow.businessObject);
        })
      );


      it('should keep DefaultFlow when morphing Gateway -> undo',
        inject(function(elementRegistry, bpmnReplace, popupMenu, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
              exclusiveGateway = elementRegistry.get('ExclusiveGateway_1');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-default-flow');

          bpmnReplace.replaceElement(exclusiveGateway, { type: 'bpmn:InclusiveGateway' });

          commandStack.undo();

          // then
          expect(exclusiveGateway.businessObject.default).to.equal(sequenceFlow.businessObject);
        })
      );


      it('should remove any conditionExpression when morphing to DefaultFlow',
        inject(function(elementRegistry, modeling, popupMenu, moddle) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
              exclusiveGateway = elementRegistry.get('ExclusiveGateway_1');

          var conditionExpression = moddle.create('bpmn:FormalExpression', {
            body: ''
          });

          modeling.updateProperties(sequenceFlow, {
            conditionExpression: conditionExpression
          });

          // when
          openPopup(sequenceFlow);

          // trigger DefaultFlow replacement
          triggerAction(popupMenu, 'replace-with-default-flow');

          // then
          expect(exclusiveGateway.businessObject.default).to.equal(sequenceFlow.businessObject);
          expect(sequenceFlow.businessObject.conditionExpression).not.to.exist;
        })
      );


      it('should remove any conditionExpression when morphing to DefaultFlow -> undo',
        inject(function(elementRegistry, modeling, popupMenu, moddle, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
              exclusiveGateway = elementRegistry.get('ExclusiveGateway_1');

          var conditionExpression = moddle.create('bpmn:FormalExpression', { body: '' });

          modeling.updateProperties(sequenceFlow, { conditionExpression: conditionExpression });

          // when
          openPopup(sequenceFlow);

          // trigger DefaultFlow replacement
          triggerAction(popupMenu, 'replace-with-default-flow');

          commandStack.undo();

          // then
          expect(exclusiveGateway.businessObject.default).not.to.exist;
          expect(sequenceFlow.businessObject.conditionExpression).to.equal(conditionExpression);
        })
      );

    });


    describe('conditional flows', function() {

      var diagramXML = require('./ReplaceMenuProvider.conditionalFlows.bpmn');

      beforeEach(bootstrapModeler(diagramXML, {
        modules: testModules
      }));


      it('should morph into a ConditionalFlow', inject(function(elementRegistry, popupMenu) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_2');

        // when
        openPopup(sequenceFlow);

        triggerAction(popupMenu, 'replace-with-conditional-flow');

        // then
        expect(sequenceFlow.businessObject.conditionExpression.$type).to.equal('bpmn:FormalExpression');
      }));


      it('should morph into a ConditionalFlow -> undo', inject(
        function(elementRegistry, popupMenu, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_2');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-conditional-flow');

          commandStack.undo();

          // then
          expect(sequenceFlow.businessObject.conditionExpression).not.to.exist;
        }
      ));


      it('should morph back into a SequenceFlow', inject(function(elementRegistry, popupMenu) {

        // given
        var sequenceFlow = elementRegistry.get('SequenceFlow_2');

        // when
        openPopup(sequenceFlow);

        // trigger ConditionalFlow replacement
        triggerAction(popupMenu, 'replace-with-conditional-flow');

        openPopup(sequenceFlow);

        // replace with SequenceFlow
        triggerAction(popupMenu, 'replace-with-sequence-flow');

        // then
        expect(sequenceFlow.businessObject.conditionExpression).not.to.exist;
      }));


      it('should replace ConditionalFlow with SequenceFlow when changing source',
        inject(function(elementRegistry, popupMenu, modeling) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
              startEvent = elementRegistry.get('StartEvent_1');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-conditional-flow');

          // when
          modeling.reconnectStart(sequenceFlow, startEvent, [
            { x: 196, y: 197, original: { x: 178, y: 197 } },
            { x: 497, y: 278, original: { x: 547, y: 278 } }
          ]);

          // then
          expect(sequenceFlow.businessObject.conditionExpression).not.to.exist;
        })
      );


      it('should replace ConditionalFlow with SequenceFlow when changing source -> undo',
        inject(function(elementRegistry, popupMenu, modeling, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
              startEvent = elementRegistry.get('StartEvent_1');

          // when
          openPopup(sequenceFlow);

          triggerAction(popupMenu, 'replace-with-conditional-flow');

          // when
          modeling.reconnectStart(sequenceFlow, startEvent, [
            { x: 196, y: 197, original: { x: 178, y: 197 } },
            { x: 497, y: 278, original: { x: 547, y: 278 } }
          ]);

          commandStack.undo();

          // then
          expect(sequenceFlow.businessObject.conditionExpression.$type).to.equal('bpmn:FormalExpression');
        })
      );


      [
        'bpmn:Activity',
        'bpmn:EndEvent',
        'bpmn:IntermediateThrowEvent',
        'bpmn:IntermediateCatchEvent'
      ].forEach(function(type) {

        it('should keep ConditionalFlow when changing target to ' + type,
          inject(function(elementRegistry, elementFactory, canvas, popupMenu, modeling) {

            // given
            var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
                root = canvas.getRootElement(),
                intermediateEvent = elementFactory.createShape({ type: type });

            modeling.createShape(intermediateEvent, { x: 497, y: 197 }, root);

            openPopup(sequenceFlow);

            triggerAction(popupMenu, 'replace-with-conditional-flow');

            // when
            modeling.reconnectEnd(sequenceFlow, intermediateEvent, [
              { x: 389, y: 197, original: { x: 389, y: 197 } },
              { x: 497, y: 197, original: { x: 497, y: 197 } }
            ]);

            // then
            expect(sequenceFlow.businessObject.conditionExpression).to.exist;
          })
        );

      });


      it('should replace ConditionalFlow with SequenceFlow when changing target -> undo',
        inject(function(elementRegistry, elementFactory, canvas, popupMenu, modeling, commandStack) {

          // given
          var sequenceFlow = elementRegistry.get('SequenceFlow_3'),
              root = canvas.getRootElement(),
              intermediateEvent = elementFactory.createShape({ type: 'bpmn:StartEvent' });

          modeling.createShape(intermediateEvent, { x: 497, y: 197 }, root);

          openPopup(sequenceFlow);

          // trigger ConditionalFlow replacement
          triggerAction(popupMenu, 'replace-with-conditional-flow');

          // when
          modeling.reconnectEnd(sequenceFlow, intermediateEvent, [
            { x: 389, y: 197, original: { x: 389, y: 197 } },
            { x: 497, y: 197, original: { x: 497, y: 197 } }
          ]);

          commandStack.undo();

          // then
          expect(sequenceFlow.businessObject.conditionExpression.$type).to.equal('bpmn:FormalExpression');
        })
      );

    });


    describe('adhoc sub process', function() {

      var diagramXML = require('./ReplaceMenuProvider.collapsedSubProcess.bpmn');

      beforeEach(bootstrapModeler(diagramXML, {
        modules: testModules.concat(autoResizeModule)
      }));


      describe('sub process -> adhoc', function() {

        it('should not resize', inject(function(elementRegistry, modeling, popupMenu) {

          // given
          var subProcess = elementRegistry.get('SubProcess_1');

          var resizeShapeSpy = spy(modeling, 'resizeShape');

          // when
          openPopup(subProcess);

          var adHocEntry = queryEntry('toggle-adhoc');

          popupMenu.trigger(globalEvent(adHocEntry, { x: 0, y: 0 }));

          // then
          expect(resizeShapeSpy).not.to.have.been.called;
        }));


        it('should not lay out connection', inject(function(elementRegistry, modeling, popupMenu) {

          // given
          var subProcess = elementRegistry.get('SubProcess_1');

          var layoutConnectionSpy = spy(modeling, 'layoutConnection');

          // when
          openPopup(subProcess);

          var adHocEntry = queryEntry('toggle-adhoc');

          popupMenu.trigger(globalEvent(adHocEntry, { x: 0, y: 0 }));

          // then
          expect(layoutConnectionSpy).not.to.have.been.called;
        }));

      });

      describe('adhoc -> sub process', function() {

        it('should not resize', inject(function(elementRegistry, modeling, popupMenu) {

          // given
          var adhocSubProcess = elementRegistry.get('AdhocSubProcess_1');

          var resizeShapeSpy = spy(modeling, 'resizeShape');

          // when
          openPopup(adhocSubProcess);

          var adHocEntry = queryEntry('toggle-adhoc');

          popupMenu.trigger(globalEvent(adHocEntry, { x: 0, y: 0 }));

          // then
          expect(resizeShapeSpy).not.to.have.been.called;
        }));


        it('should not lay out connection', inject(function(elementRegistry, modeling, popupMenu) {

          // given
          var adhocSubProcess = elementRegistry.get('AdhocSubProcess_1');

          var layoutConnectionSpy = spy(modeling, 'layoutConnection');

          // when
          openPopup(adhocSubProcess);

          var adHocEntry = queryEntry('toggle-adhoc');

          popupMenu.trigger(globalEvent(adHocEntry, { x: 0, y: 0 }));

          // then
          expect(layoutConnectionSpy).not.to.have.been.called;
        }));

      });

    });

  });


  describe('rules', function() {

    var diagramXML = require('../../../fixtures/bpmn/basic.bpmn');

    beforeEach(bootstrapModeler(diagramXML, {
      modules: testModules.concat([ customRulesModule ])
    }));


    it('should get entries by default', inject(function(elementRegistry) {

      // given
      var startEvent = elementRegistry.get('StartEvent_1');

      // when
      openPopup(startEvent);

      // then
      expect(queryEntries()).to.have.length.above(0);
    }));


    it('should get entries when custom rule returns true',
      inject(function(elementRegistry, popupMenu, customRules) {

        // given
        var startEvent = elementRegistry.get('StartEvent_1');

        customRules.addRule('shape.replace', function() {
          return true;
        });

        // when
        openPopup(startEvent);

        // then
        expect(queryEntries()).to.have.length.above(0);
      })
    );


    it('should get no entries when custom rule returns false',
      inject(function(elementRegistry, popupMenu, customRules) {

        // given
        var startEvent = elementRegistry.get('StartEvent_1');

        customRules.addRule('shape.replace', function() {
          return false;
        });

        // when
        openPopup(startEvent);

        // then
        expect(queryEntries()).to.have.length(0);
      })
    );


    it('should provide element to custom rules', inject(function(elementRegistry, popupMenu, customRules) {

      // given
      var startEvent = elementRegistry.get('StartEvent_1');
      var actual;

      customRules.addRule('shape.replace', function(context) {
        actual = context.element;
      });

      // when
      openPopup(startEvent);

      // then
      expect(actual).to.equal(startEvent);
    }));


    it('should evaluate rule once', inject(function(elementRegistry, popupMenu, customRules) {

      // given
      var callCount = 0;
      var startEvent = elementRegistry.get('StartEvent_1');

      customRules.addRule('shape.replace', function() {
        callCount++;
      });

      // when
      openPopup(startEvent);

      // then
      expect(callCount).to.equal(1);
    }));

  });

});



// helper /////
function queryEntry(id) {
  var container = getBpmnJS().get('canvas').getContainer();

  return domQuery('.djs-popup [data-id="' + id + '"]', container);
}

/**
 * Gets all menu entries from the current open popup menu
 *
 * @param  {PopupMenu} popupMenu
 *
 * @return {<Array>}
 */
function queryEntries() {
  var container = getBpmnJS().get('canvas').getContainer();

  return domQueryAll('.djs-popup .entry', container);
}

function triggerAction(popupMenu, id) {
  var entry = queryEntry(id);

  if (!entry) {
    throw new Error('entry "'+ id +'" not found in replace menu');
  }

  popupMenu.trigger(globalEvent(entry, { x: 0, y: 0 }));
}
