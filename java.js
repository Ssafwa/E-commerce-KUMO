const header = document.querySelector("header");

window.addEventListener ("scroll", function(){
    header.classList.toggle ("sticky", this.window.scrollY > 0);
    
})

/*like button*/

document.querySelectorAll('.heart-icon').forEach(wrapper => {
    const icon = wrapper.querySelector('i');

    wrapper.addEventListener('click', function () {
        icon.classList.toggle('liked');
        icon.classList.toggle('bx-heart');
        icon.classList.toggle('bxs-heart');

        
        wrapper.classList.remove('burst');
        void wrapper.offsetWidth; 
        wrapper.classList.add('burst');
    });
});

let menu = document.querySelector('#menu-icon');
let navmenu = document.querySelector('.navmenu');

menu.onclick = () => {
    menu.classList.toggle('bx-x');
    navmenu.classList.toggle('open');
}