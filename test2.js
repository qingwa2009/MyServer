'use strict';
try {
    let a=new Date("aaaaa");
    console.log(a.getTime());
    a=a+1
    console.log(a);
    
} catch (error) {
    console.log("eeeee",error);
}