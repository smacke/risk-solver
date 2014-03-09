$(function() {

    var numpatt = /^[1-9]\d*$/;

    function disp_error(err) {
        $('#answer').hide();
        $('#error').html(err).show();
    }

    $('input').keydown(function() {
        var next = $(this).closest('li').next();
        next.show();
        next = next.next();
        // if next <li> is the button, show it too
        if (next.is(':last-child')) next.show();
    });

    $('#defenders').keyup(function() {
        var n_armies = 0;
        var defenders = $('#defenders').val();
        if (defenders) {
            n_armies = defenders.split(',').length;
        }
        var fortify_text = n_armies ? '1' : '';
        for (var i=0; i<n_armies; i++) {
            fortify_text += ',1';
        }
        $('#fortify').prop('placeholder', fortify_text);
    });
    
    $('#calc').click(function() {
        tour = {}
        var attackers = $('#attackers').val();

        if (!numpatt.test(attackers)) {
            //handle error
            disp_error('Attacker box should hold a single positive integer.');
            return;
        }
        tour.attackers = parseInt(attackers);

        var defenders = $('#defenders').val();
        var darr = defenders.split(',');

        if (darr.length>30) {
            //handle sarcastic error
            disp_error('You are not actually playing risk, are you?');
            return;
        }

        for (var i=0; i<darr.length; i++) {
            if (!numpatt.test(darr[i])) {
                //handle error
                disp_error('Each comma-separated value in the defenders box should be a positive integer.');
                return;
            }
            darr[i] = parseInt(darr[i]);
        }

        tour.defending_armies = darr;

        var fortify = $('#fortify').val();

        if (fortify) {
            var farr = fortify.split(',');
            if (farr.length != darr.length+1) {
                //handle error
                disp_error('Fortifying units box should have one more value than defender box.');
                return;
            }
            for (var i=0; i<farr.length; i++) {
                if (!numpatt.test(farr[i])) {
                    //handle error
                    disp_error('Each comma-separated value in the fortifying units box should be a positive integer.');
                    return;
                }
                farr[i] = parseInt(farr[i]);
            }
            tour.fortifying_armies = farr;
        }
        
        $('#error').hide()
        $('#answer').html(tourprob(tour)).show();

    });

});
