import ts=require("./typesystem");
var messageRegistry = ts.messageRegistry;
import {Status} from "./typesystem";
import {PropertyIs} from "./restrictions";
import ni=require("raml-typesystem-interfaces");
import tsInterfaces=ni.tsInterfaces

export class MetaInfo extends ts.TypeInformation {


    constructor(private _name: string,private _value: any,inhertitable:boolean=false){
        super(inhertitable)
    }

    value(){
        return this._value;
    }

    requiredType(){
        return ts.ANY;
    }
    facetName(){
        return this._name;
    }

    kind() : tsInterfaces.MetaInformationKind {
        //to be overriden in subtypes
        return null;
    }
}
export class Description extends MetaInfo{

    constructor(value:string){
        super("description",value)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Description;
    }
}
export  class NotScalar extends MetaInfo{
    constructor(){
        super("notScalar",true)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.NotScalar;
    }
}
export class DisplayName extends MetaInfo{


    constructor(value:string){
        super("displayName",value)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.DisplayName;
    }
}
export class Usage extends MetaInfo{


    constructor(value:string){
        super("usage",value)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Usage;
    }
}
export class Annotation extends MetaInfo implements tsInterfaces.IAnnotation{

    constructor(name: string,value:any){
        super(name,value)
    }

    name(){
        return this.facetName();
    }

    definition(){
        var owner=this.owner();
        if (owner){
            var reg=owner.collection();
            if (reg){
                var tp=reg.getAnnotationType(this.facetName());
                return tp;
            }
        }
        return null;
    }

    private _ownerFacet:tsInterfaces.ITypeFacet;

    validateSelf(registry:ts.TypeRegistry,ofExample:boolean=false):ts.Status {
        return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Annotation;
    }

    ownerFacet(){
        return this._ownerFacet;
    }

    setOwnerFacet(ownerFacet:tsInterfaces.ITypeFacet){
        this._ownerFacet = ownerFacet;
    }
}
export class FacetDeclaration extends MetaInfo{

    constructor(
        private name: string,
        private _type:ts.AbstractType,
        private optional:boolean,
        private builtIn = false){
        super(name,_type,true)
    }
    actualName(){
        if (this.name.charAt(this.name.length-1)=='?'){
            return this.name.substr(0,this.name.length-1);
        }
        return this.name;
    }

    isOptional(){
        return this.optional;
    }
    type():ts.AbstractType{
        return this._type;
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.FacetDeclaration;
    }
    
    isBuiltIn():boolean{
        return this.builtIn;
    }
}
export class CustomFacet extends MetaInfo{

    constructor(name: string,value:any){
        super(name,value,true)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.CustomFacet;
    }
}

function serializeToXml(value: any, type: ts.AbstractType): string {
    throw new Error("This version is not capable to store things in XML")
    //return xmlio.serializeToXML(value, type);
}

function parseExampleIfNeeded(val:any,type:ts.AbstractType):any{
    if (typeof val==='string'){
        if (type.isObject() || type.isArray() || type.isExternal() || type.isUnion()){
            var exampleString:string=val;
            var firstChar = exampleString.trim().charAt(0);
            if (!type.isExternal()
                &&(firstChar=="{" || firstChar=="[" || exampleString.trim()=="null")){
                try {
                    return JSON.parse(exampleString);
                } catch (e) {
                    if (type.isObject()||type.isArray()){
                        var c = ts.error(messageRegistry.CAN_NOT_PARSE_JSON, this, { msg: e.message });
                        return c;
                    }
                }
            }
            if (firstChar=="<") {
                throw new Error("This version is not capable to deal with XML")
            }
        }
    }
    if (type.getExtra(tsInterfaces.REPEAT)){
        val=[val];
    }
    return val;
}

var exampleScalarProperties = [
    {propName: "strict", propType: "boolean", messageEntry:messageRegistry.STRICT_BOOLEAN},
    {propName: "displayName", propType: "string", messageEntry:messageRegistry.DISPLAY_NAME_STRING},
    {propName: "description", propType: "string", messageEntry:messageRegistry.DESCRIPTION_STRING}
];

export class Example extends MetaInfo{
    constructor(value:any){
        super("example",value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        return ts.ok();
    }


    
    example():any{
        var val=this.value();
        if (typeof val==="object"&&val){
            if (val.value){
                val=val.value;
            }
        }
        return parseExampleIfNeeded(val, this.owner());
    }

    asXMLString(): string {
        var value = this.value();

        if(typeof value === 'string' && value.trim().indexOf('<') === 0) {
            return value;
        }

        var parsedValue: any = parseExampleIfNeeded(value, this.owner());

        return serializeToXml(parsedValue, this.owner());
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Example;
    }
}
export class Required extends MetaInfo{
    constructor(value:any){
        super("required",value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
       return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Required;
    }
}

export class HasPropertiesFacet extends MetaInfo{
    constructor(){
        super("hasPropertiesFacet",null);
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.HasPropertiesFacet;
    }
}
export class AllowedTargets extends MetaInfo{
    constructor(value:any){
        super("allowedTargets",value)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.AllowedTargets;
    }
}

export class Examples extends MetaInfo{
    constructor(value:any){
        super("examples",value)
    }

    examples():any[]{
        var v=this.value();
        var result:any[]=[];
        Object.keys(v).forEach(x=>{
            if (typeof v[x]=='object'&&v[x]) {
                var val=v[x].value;
                if (!val){
                    val=v[x];
                }
                var example = parseExampleIfNeeded(val, this.owner());
                result.push(example);
            }
        });
        return result;
    }

    asXMLStrings(): string[] {
        var value = this.value();

        var result: any = {};

        Object.keys(value).forEach(key => {
            var childValue: any = value[key];

            if(typeof childValue === 'string' && childValue.trim().indexOf('<') === 0) {
                result[key] = childValue;

                return;
            }

            var parsedValue: any = parseExampleIfNeeded(childValue, this.owner());

            result[key] = serializeToXml(parsedValue, this.owner());
        });

        return result;
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
       return ts.ok()
    }



    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Examples;
    }
}

export class XMLInfo extends MetaInfo{
    constructor(o:any){
        super("xml",o)
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.XMLInfo;
    }
}

export class Default extends MetaInfo{

    constructor(value:any){
        super("default",value)
    }

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Default;
    }
}
export class Discriminator extends ts.TypeInformation{

    constructor(public property: string){
        super(true);
    }

    requiredType(){
        return ts.OBJECT;
    }

    value(){
        return this.property;
    }
    facetName(){return "discriminator"}

    validateSelf(registry:ts.TypeRegistry):ts.Status {
       return ts.ok();
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.Discriminator;
    }
}

export class DiscriminatorValue extends ts.Constraint{
    constructor(public _value: any, protected strict:boolean=true){
        super(false);
    }

    check(i:any,path:tsInterfaces.IValidationPath):Status{
        var owner = this.owner();//_.find([t].concat(t.allSuperTypes()),x=>x.getExtra(TOPLEVEL));
        var dVal:string = this.value();
        var discriminator = owner.metaOfType(Discriminator);
        if(discriminator.length==0){
            return ts.ok();
        }
        var dName = discriminator[0].value();
        // if(owner) {
        //     dVal = owner.name();
        // }
        // var discriminatorValue = t.metaOfType(metaInfo.DiscriminatorValue);
        // if(discriminatorValue.length!=0){
        //     dVal = discriminatorValue[0].value();
        // }
        if(dVal) {
            if (i.hasOwnProperty(dName)) {
                var queue = this.owner().allSubTypes().concat(this.owner());
                var knownDiscriminatorValues:any = {};
                for(var t of queue){
                    let dvArr = t.metaOfType(DiscriminatorValue);
                    if(dvArr && dvArr.length >0){
                       dvArr.forEach(dv=>knownDiscriminatorValues[dv.value()] = true);
                    }
                }
                var adVal = i[dName];
                if (!knownDiscriminatorValues[adVal]) {
                    var wrng = ts.error(Status.CODE_INCORRECT_DISCRIMINATOR, this, {
                        rootType : owner.name(),
                        value: adVal,
                        propName: dName
                    }, Status.WARNING );
                    //var wrng = new Status(Status.WARNING, Status.CODE_INCORRECT_DISCRIMINATOR, dVal, this);
                    ts.setValidationPath(wrng,{name: dName, child: path});
                    return wrng;
                }
                return ts.ok();
            }
            else {
                var err = ts.error(Status.CODE_MISSING_DISCRIMINATOR, this, {
                    rootType: owner.name(),
                    propName: dName
                });
                //var err = new Status(Status.ERROR, Status.CODE_MISSING_DISCRIMINATOR, dVal, this);
                ts.setValidationPath(err,path);
                return err;
            }
        }
        return ts.ok();
    }
    facetName(){return "discriminatorValue"}

    validateSelf(registry:ts.TypeRegistry):ts.Status {
        return ts.ok();
    }

    requiredType(){
        return ts.OBJECT;
    }
    value(){
        return this._value;
    }

    kind() : tsInterfaces.MetaInformationKind {
        return tsInterfaces.MetaInformationKind.DiscriminatorValue;
    }
    
    isStrict():boolean{ return this.strict; }
}