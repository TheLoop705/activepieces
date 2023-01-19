import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { filter, forkJoin, from, map, Observable, of, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { CodeActionSettings } from '@activepieces/shared';
import { FlowItem } from 'packages/frontend/src/app/modules/common/model/flow-builder/flow-item';
import { FlowItemDetails } from 'packages/frontend/src/app/modules/flow-builder/page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { CodeService } from 'packages/frontend/src/app/modules/flow-builder/service/code.service';
import { BuilderSelectors } from 'packages/frontend/src/app/modules/flow-builder/store/builder/builder.selector';

import { TestCodeFormModalComponent } from '../../../code-artifact-form-control/code-artifact-control-fullscreen/test-code-form-modal/test-code-form-modal.component';
import { MentionListItem, MentionTreeNode, traverseStepOutputAndReturnMentionTree } from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';

@Component({
	selector: 'app-code-step-mention-item',
	templateUrl: './code-step-mention-item.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeStepMentionItemComponent implements OnInit {
	@Input() stepMention: MentionListItem & { step: FlowItem };
	@Input() stepIndex: number;
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
	flowItemDetails$: Observable<FlowItemDetails | undefined>;
	codeStepTest$: Observable<{ children: MentionTreeNode[] | undefined; error?: boolean }>;
	testing$: Subject<boolean> = new Subject();
	constructor(
		private store: Store,
		private dialogService: MatDialog,
		private codeService: CodeService,
		private mentionsTreeCache: MentionsTreeCacheService
	) {}
	ngOnInit(): void {
		const cacheResult = this.mentionsTreeCache.getStepMentionsTree(this.stepMention.step.name);
		if (cacheResult) {
			this.codeStepTest$ = of({ children: cacheResult, error: false });
		}
		this.flowItemDetails$ = this.store.select(BuilderSelectors.selectFlowItemDetails(this.stepMention.step));
	}
	openTestCodeModal() {
		const codeStepSettings = this.stepMention.step.settings as CodeActionSettings;
		const testData = codeStepSettings.input;
		const artifact$ = this.getArtifactObs$(codeStepSettings);
		this.codeStepTest$ = this.dialogService
			.open(TestCodeFormModalComponent, { data: { testData: testData } })
			.afterClosed()
			.pipe(
				filter(res => {
					return !!res;
				}),
				tap(() => {
					this.testing$.next(true);
				}),
				switchMap(context => {
					return forkJoin({
						context: of(context),
						artifact: artifact$,
					});
				}),
				switchMap(res => {
					return this.codeService.executeTest(res.artifact, res.context);
				}),
				tap(() => {
					this.testing$.next(false);
				}),
				map(result => {
					if (result.standardError) {
						return { error: true, children: [] };
					}
					const outputResult = result.output;
					if (typeof outputResult !== 'object') return { children: [] };
					const childrenNodes = traverseStepOutputAndReturnMentionTree(
						outputResult,
						this.stepMention.step.name,
						this.stepMention.step.displayName
					).children;
					return { children: childrenNodes };
				}),
				tap(res => {
					this.mentionsTreeCache.setStepMentionsTree(this.stepMention.step.name, res.children || []);
				}),
				shareReplay(1)
			);
	}
	getArtifactObs$(codeStepSettings: CodeActionSettings) {
		if (codeStepSettings.artifactSourceId) {
			return this.codeService.downloadAndReadFile(CodeService.constructFileUrl(codeStepSettings.artifactSourceId));
		} else {
			return from(this.codeService.readFile(atob(codeStepSettings.artifact!)));
		}
	}
	emitMention(mentionListItem: MentionListItem) {
		this.mentionClicked.emit(mentionListItem);
	}
}