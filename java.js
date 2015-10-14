$(document).ready(function(){
    $('button[name=Calculate]').on('click', function(){
       $('.answer').remove();
       var Age = $('input[name=Age]').val();
       var CKD = $('input[name=CKD]').val();
       var DM = $('input[name=DM]').val();
       var prob = 100*((e^0.240343)*(e^(-0.052698*Age))*( e^(0.458596*CKD))*( e^(0.236863*DM)) / (1 +(e^0.240343)*(e^(-0.052698*Age))*( e^(0.458596*CKD))*( e^(0.236863*DM)))); 
       $('#div1').append("<div class='answer'>Probability of TKA Revision = "+prob.toFixed(3)+"%</div>");
    });
});
