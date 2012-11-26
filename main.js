var password = localStorage["password"];
var p = {};
p.ks = 256;
p.adata = "autodecrypt";
var rp = {};

var strings = {
  no_pass: "Press ctrl + shift + [ to enter a password.",
  pass_entered: "Decrypting..."
}

// sets up the insertion of the status element
function insert_status_ele() {
  var div = document.createElement('div');
  div.id = "encryption_status";
  document.getElementsByTagName('body')[0].appendChild(div);
  set_status(password?strings.pass_entered:strings.no_pass);
}

// displays a status message for 5 seconds
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

// keyboard shortcuts!
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

// monitor the dom for anything to decrypt

document.addEventListener("DOMNodeInserted", function(e) {
  if(e.target.nodeType == Node.ELEMENT_NODE){
    autodecrypt(e.target);
  }
}, false);

function autodecrypt(doc) {
  if (password !== '') {
    var all_eles = [];
    var regex =  new RegExp('\\snode_text\\s|\\scommentText\\s');
    if(regex.test(' '+doc.className+' ')){
      all_eles.push(doc);
    } else {
      var eles = doc.getElementsByClassName('node_text'); //and check the current node
      for(var i = 0; i < eles.length; i++){
        all_eles.push(eles[i]);
      }
      var eles2 = doc.getElementsByClassName('commentText');
      for(i = 0; i < eles2.length; i++){
        all_eles.push(eles2[i]);
      }
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
                pt = pt.replace(/\n/g, "--NeWlInE--");
                ele.textContent = pt;
                ele.innerHTML = ele.textContent.replace(/--NeWlInE--/g, "<br/>");
                ele.className = "decrypted";
              }
            }
          }
        }
      }
    }
  }
}


// add shortcuts info in the sidebar
function add_shortcut_info() {
  var sidenotes = document.getElementsByClassName('sidenotes');
  if(sidenotes.length > 0){
    var ele = sidenotes[0].getElementsByTagName('dl')[0];
    ele.innerHTML += '<dt>Ctrl+[</dt>'+
    '<dd>Decrypt (inside an edit box)</dd>'+
    '<dt>Ctrl+]</dt>'+
    '<dd>Encrypt (inside an edit box)</dd>'+
    '<dt>Ctrl+{</dt>'+
    '<dd>Set password</dd>';
  }
}

insert_status_ele();
add_shortcut_info();