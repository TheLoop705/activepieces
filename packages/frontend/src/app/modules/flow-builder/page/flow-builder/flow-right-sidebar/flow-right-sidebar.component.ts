import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { RightSideBarType } from '../../../../common/model/enum/right-side-bar-type.enum';
import { map, Observable, tap } from 'rxjs';
import { Store } from '@ngrx/store';

import { FormControl } from '@angular/forms';
import { BuilderSelectors } from '../../../store/builder/builder.selector';
import { CdkDragMove } from '@angular/cdk/drag-drop';
import { FlowItem } from '../../../../common/model/flow-builder/flow-item';
import { ActionType, TriggerType } from '@activepieces/shared';
import { TestStepService } from '../../../service/test-step.service';

@Component({
  selector: 'app-flow-right-sidebar',
  templateUrl: './flow-right-sidebar.component.html',
  styleUrls: ['./flow-right-sidebar.component.scss'],
})
export class FlowRightSidebarComponent implements OnInit {
  ActionType = ActionType;
  TriggerType = TriggerType;
  rightSidebarType$: Observable<RightSideBarType>;
  testFormControl: FormControl<string> = new FormControl('', {
    nonNullable: true,
  });
  currentStep$: Observable<FlowItem | null | undefined>;
  editStepSectionRect: DOMRect;
  @ViewChild('editStepSection', { read: ElementRef })
  editStepSection: ElementRef;
  @ViewChild('selectedStepResultContainer', { read: ElementRef })
  selectedStepResultContainer: ElementRef;
  elevateResizer$: Observable<void>;
  animateSectionsHeightChange = false;
  constructor(
    private store: Store,
    private ngZone: NgZone,
    private testStepService: TestStepService,
    private renderer2: Renderer2
  ) {}

  ngOnInit(): void {
    this.rightSidebarType$ = this.store.select(
      BuilderSelectors.selectCurrentRightSideBarType
    );
    this.currentStep$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        tap(() => {
          this.elevateResizer$ = this.testStepService.elevateResizer$.pipe(
            tap((shouldAnimate) => {
              if (shouldAnimate) {
                this.resizerAnimation();
              }
            }),
            map(() => void 0)
          );
        })
      );
  }

  get sidebarType() {
    return RightSideBarType;
  }
  resizerDragStarted() {
    this.editStepSectionRect =
      this.editStepSection.nativeElement.getBoundingClientRect();
  }
  resizerDragged(dragMoveEvent: CdkDragMove) {
    const height = this.editStepSectionRect.height + dragMoveEvent.distance.y;
    this.ngZone.runOutsideAngular(() => {
      this.renderer2.setStyle(
        this.editStepSection.nativeElement,
        'height',
        `${height}px`
      );
      this.renderer2.setStyle(
        this.selectedStepResultContainer.nativeElement,
        'max-height',
        `calc(100% - ${height}px - 5px)`
      );
    });
  }
  resizerAnimation() {
    this.animateSectionsHeightChange = true;
    this.renderer2.setStyle(
      this.editStepSection.nativeElement,
      'height',
      `calc(50% - 30px)`
    );
    this.renderer2.setStyle(
      this.selectedStepResultContainer.nativeElement,
      'max-height',
      `calc(50% + 26px)`
    );
    setTimeout(() => {
      this.animateSectionsHeightChange = false;
    }, 150);
  }
  resetTopResizerSectionHeight() {
    this.renderer2.removeStyle(this.editStepSection.nativeElement, 'height');
  }
}
