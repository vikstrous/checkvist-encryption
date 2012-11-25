var password = localStorage["password"];
var p = {};
p.ks = 256;
p.adata = "autodecrypt";
var rp = {};

var strings = {
  no_pass: "Press ctrl + shift + [ to enter a password.",
  pass_entered: "Decrypting..."
}

function insert_status_ele() {
  var div = document.createElement('div');
  div.id = "encryption_status";
  document.getElementsByTagName('body')[0].appendChild(div);
  set_status(password?strings.pass_entered:strings.no_pass);
}
insert_status_ele();

function set_status(text) {
  document.getElementById('encryption_status').textContent = text;
  if(text)
    setTimeout(function(){set_status('');}, 5000);
}

function password_prompt() {
  var pass = prompt("Password");
  if(pass){
    password = pass;
    localStorage['password'] = password;
    set_status(strings.pass_entered);
  } else {
    set_status(strings.no_pass);
  }
}

document.onkeydown = function(e) {
  var res = '';
  var isCtrl = e.ctrlKey;
  var isShift = e.shiftKey;
  if ((e.which === 219 || e.which === 221) && isCtrl) {
    if (isShift) password_prompt();
    else if (password === "") {
      password_prompt();
    }
  }
  if (e.which === 219 && isCtrl && !isShift) { // [
    if (password !== '' && e.srcElement.value && e.srcElement.value[0] == '{') {
      try {
        res = sjcl.decrypt(password, e.srcElement.value, {}, rp);
      } catch (e) {
        set_status('Wrong password.');
      }
      if (res) {
        e.srcElement.value = res
      }
    }
  }
  if (e.which === 221 && isCtrl && !isShift) { // ]
    if (password !== '' && e.srcElement.value) {
      try {
        res = sjcl.encrypt(password, e.srcElement.value, p, rp);
      } catch (e) {
        console.log('failed to encrypt');
      }
      if (res) {
        e.srcElement.value = res
      }
    }
  }
}

setInterval(function autodecrypt() {
  if (password !== '') {
    var all_eles = [];
    var eles = document.getElementsByClassName('node_text');
    for(var i = 0; i < eles.length; i++){
      all_eles.push(eles[i]);
    }
    var eles2 = document.getElementsByClassName('commentText');
    for(i = 0; i < eles2.length; i++){
      all_eles.push(eles2[i]);
    }
    for (i = 0; i < all_eles.length; i++) {
      var ele = all_eles[i].getElementsByTagName('p')[0];
      if (ele) {
        var ct = ele.textContent;
        if (ct) {
          var pt;
          var success = false;
          if (ct[0] === '{') {
            try {
              var jct = JSON.parse(ct);
            } catch (e) {
              // not a valid json
            }
            if (jct && jct.adata == 'autodecrypt') {
              try {
                pt = sjcl.decrypt(password, ct, {}, rp);
                success = true;
              } catch (e) {
                set_status('Wrong password.');
              }
              if (success) {
                ele.textContent = pt;
                ele.className = "decrypted";
              }
            }
          }
        }
      }
    }
  }
}, 1000);