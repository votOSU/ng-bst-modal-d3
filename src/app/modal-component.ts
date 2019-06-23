import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { loadModules } from 'esri-loader';
import * as d3 from 'd3';

@Component({
  selector: 'ngbd-modal-content',
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Hi there! {{StateName}}</h4>
      <button type="button" class="close" aria-label="Close" (click)="activeModal.dismiss('Cross click')">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div class="modal-body">
      <p>Hello, {{name}}!</p>
      <div class="container">
        <div class="row">
          <div class="col-sm">
            <div class="femaleChart">{{FemalePercent | number }}</div>
          </div>
          <div class="col-sm">
            One of three columns is : {{StateName}}
          </div>
          <div class="col-sm">
            One of three columns num: {{SomeNumber | number}}
          </div>
          <div class="donutChart"></div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-dark" (click)="activeModal.close('Close click')">Close</button>
    </div>
  `
})
export class NgbdModalContent {
  @Input() name;
  @Input () StateName;
  @Input () SomeNumber : number; 
  @Input () FemalePercent: number;

  constructor(public activeModal: NgbActiveModal) {}
}

@Component({
  selector: 'ngbd-modal-component',
  templateUrl: './modal-component.html'
})
// export class MuniMap implements AfterViewInit {
//   constructor(private modalService: NgbModal) {}

//   open() {
//     const modalRef = this.modalService.open(NgbdModalContent);
//     modalRef.componentInstance.name = 'World';
//     modalRef.componentInstance.StateName = "Phila";
//   }
// }

export class MapComponent implements AfterViewInit {

  @Output() selectedFeature = new EventEmitter();

  @ViewChild('mapNode') private mapNodeElementRef: ElementRef;
  @ViewChild('legendNode') private legendNodeElementRef: ElementRef;
  //@ViewChild('content') private contentElementRef: ElementRef;

  public stateName: string;
  public pop2000: string;
  femaleNum: number = 300;
  maleNum: number; 
  sumGender: number;
  femalePercent: number;
  malePercent: number; 

  width = 300
  height = 300
  margin = 60
  radius ;
  svg;
  color;
  pie;
  data_ready;
  // Create dummy data
  public data = { }; 
  //public data = { a: this.femalePercent, b: this.malePercent}

  constructor(private modalService: NgbModal) { }


  ngAfterViewInit() {
    const options = { version: '3.28', css: true };

    loadModules([
      'esri/map',
      'esri/layers/ArcGISDynamicMapServiceLayer',
      'esri/symbols/SimpleFillSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/Color',
      'esri/tasks/query',
      'esri/tasks/QueryTask',
      'esri/dijit/Legend'
    ], options)
      .then(([
        Map,
        ArcGISDynamicMapServiceLayer,
        SimpleFillSymbol,
        SimpleLineSymbol,
        Color,
        Query,
        QueryTask,
        Legend
      ]) => {
        const map = new Map(this.mapNodeElementRef.nativeElement, {
          center: [-96, 39],
          zoom: 4,
          basemap: 'gray'
        });

        const layer = new ArcGISDynamicMapServiceLayer('https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer', {});
        layer.setVisibleLayers([3]);

        map.addLayer(layer);

        const legend = new Legend({
          map
        }, this.legendNodeElementRef.nativeElement);
        legend.startup();

        map.on('click', event => {
          const query = new Query();
          query.outFields = ['*'];
          query.returnGeometry = true;
          query.geometry = event.mapPoint;
          const queryTask = new QueryTask('https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer/3');
          queryTask.execute(query, featureSet => {
            if (featureSet.features[0]) {
              map.graphics.clear();
              const feature = featureSet.features[0];

              const mySymbol = new SimpleFillSymbol('none',
                new SimpleLineSymbol('solid', new Color([255, 0, 0]), 2.5), new Color([0, 0, 0, 0.25])
              );

              feature.setSymbol(mySymbol);
              map.graphics.add(feature);

              this.stateName = feature.attributes.STATE_NAME;
              this.pop2000 = feature.attributes.pop2000;

              this.femaleNum = feature.attributes.FEMALES;
              this.maleNum = feature.attributes.MALES;
              this.sumGender = this.femaleNum + this.maleNum;
              this.femalePercent = ((this.femaleNum / this.sumGender) * 100);
              this.malePercent = ((this.maleNum / this.sumGender) * 100);
              //this.modalService.open(this.contentElementRef);
              
              this.openPopup();
              
              this.selectedFeature.emit(feature);
            }

          });
          
        });
      })
      .catch(err => {
        console.error(err);
      }); 
  }
  openPopup() 
  {
    
    const modalRef = this.modalService.open(NgbdModalContent, {centered: true});
    modalRef.componentInstance.name = 'World';
    modalRef.componentInstance.StateName = this.stateName;
    modalRef.componentInstance.SomeNumber = this.femaleNum;
    modalRef.componentInstance.FemalePercent = this.femalePercent;
    d3.select('.femaleChart')
    .data([30])
    .style("background-color","#0eede9")
    .style("width",+this.femalePercent+"%") //this works

    this.data = { a: Math.round(this.femalePercent), b: Math.round(this.malePercent)}
    this.radius = Math.min(this.width, this.height) / 2 - this.margin

    this.svg = d3.select(".donutChart")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", "translate(" + this.width / 2 + "," +
        this.height / 2 + ")");

    // set the color scale
    this.color = d3.scaleOrdinal()
      .domain(Object.keys(this.data))
      .range(["#0eede9", "#11fc92"]);

    // Compute the position of each group on the pie:
    this.pie = d3.pie()
      .value(function (d) { return d.value })

    this.data_ready = this.pie(d3.entries(this.data))

    this.svg
      .selectAll('whatever')
      .data(this.data_ready)
      .enter()
      .append('path')
      .attr('d', d3.arc()
        .innerRadius(130)         // This is the size of the donut hole
        .outerRadius(this.radius))
      .attr('fill',(d) => { return (this.color(d.data.key)) })
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0.7)
      
    this.svg.append("text")
      .attr("text-anchor", "middle")
      .text(Math.round(this.femalePercent)+"%")  
  }
  

}