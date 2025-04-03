const { invoke } = window.__TAURI__.core;

let Kollavarsham = kollavarsham.kollavarsham.Kollavarsham;
let KollavarshamDate = kollavarsham.kollavarsham.KollavarshamDate;

//തിരുവനന്തപുരത്തിൻ്റെ ഇടസൂചിക
let options = {
  system: 'SuryaSiddhanta', //നാള്മുറ
  latitude: 8.5,
  longitude: 77
};

//മാസങ്ങൾ
let months = ["ചിങ്ങം", "കന്നി", "തുലാം", "വൃശ്ചികം", "ധനു", "മകരം", "കുംഭം", "മീനം", "മേടം", "എടവം", "മിഥുനം", "കർക്കടം"];
let dayNames = ["ഞായർ", "തിങ്കൾ", "ചൊവ്വ", "ബുധൻ", "വ്യാഴം", "വെള്ളി", "ശനി"]
let calendar = new Kollavarsham(options);

let today = calendar.fromGregorianDate(new Date());
let currentDate = [today.year, today.month, today.date];

//അമ്പിളിയിൻ്റെ ഘട്ടം തിഥിവഴി അറിയാം
/*today.tithi*/


//Not implemented in Original library so can't do this now
let setCalendar = (yearNo, monthNo, highlightDay)=>{
  console.log(new KollavarshamDate(1200, 8, 21))
  console.log("Actual Date", today)
}

let dateNumbers = [];//List that'll help build the html Calendar 
//Sets the Dates and Stars in the Date Number Array
let setCurrentMonth = ()=>{
  dateNumbers = []
  let todGreg = new Date();
  let tod = calendar.fromGregorianDate(todGreg);
  todGreg.setHours(0)
  let m = tod.month;
  todGreg.setDate(todGreg.getDate()-tod.date+1);
  for(let i = 0; i<dayNames.indexOf((calendar.fromGregorianDate(todGreg)).mlWeekdayName);i++){
    dateNumbers.push([0,"","",""])
  }
  for(let i = 1; i<32; i++){
    let nDate = calendar.fromGregorianDate(todGreg);
    if(nDate.month!==m){
      break;
    }
    dateNumbers.push([i,nDate.mlNaksatraName,nDate.sakaDate.tithi,nDate.year, m])
    todGreg.setDate(todGreg.getDate()+1);
  }

  let f = dateNumbers.length;
  for(let i = 0; i<42-f;i++){
    dateNumbers.push([0,"","",""])
  }

  
}

//Actually changes the elements
let loadDateNumbers = ()=>{
  document.getElementById("month-name").innerHTML = `${months[dateNumbers[20][4]]} - ${EnToMlNumber(dateNumbers[20][3])}`
  let todDate = calendar.fromGregorianDate(new Date());
  todDate = todDate.date;
  let row = 1;
  let col = 1;

  for(let i = 0; i<42; i++){
    if(dateNumbers[i][0]!==0){
      document.querySelector(`#r${row}-c${col} .date-no`).innerHTML = EnToMlNumber(dateNumbers[i][0]);
      document.querySelector(`#r${row}-c${col} .date-star`).innerHTML = dateNumbers[i][1];
    }else{
      document.querySelector(`#r${row}-c${col} .date-no`).innerHTML = "";
      document.querySelector(`#r${row}-c${col} .date-star`).innerHTML = "";
    }

    let currEl = document.querySelector(`#r${row}-c${col}`);
    currEl.classList.remove("hightlighted")

    if(todDate==dateNumbers[i][0]){
      console.log("foo")
      currEl.classList.add("highlighted")
    }

    if(col==7){
      col=1;
      row++;
    }else{
      col++;
    }
  }


  

}

//Converts English Number to Malayalam Number
let EnToMlNumber = (no)=>{
  let digits = ["൧","൨","൩","൪","൫","൬","൭","൮","൯","൦"];
  let enDigits = ["1","2","3","4","5","6","7","8","9","0"];
  let d = no.toString().split("");
  let newNo = "";
  for(let i =0; i<no.toString().length;i++){
    newNo += digits[enDigits.indexOf(d[i])];
  }

  return newNo;
}
setCurrentMonth()
loadDateNumbers()