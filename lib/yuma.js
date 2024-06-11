//通过compile对模板进行解析，在解析的过程中会分析指令，并生成订阅者（函数，订阅的数据发生改变后要更新视图）
//数据和订阅者的关系是一对多的（一个数据对着多个订阅者 ）
class Yuma {
  constructor(config) {
    // 根据配置的选择器获取 DOM 元素，并将其保存为实例的属性。
    this.$el = document.querySelector(config.el);
    //将配置对象中的data属性保存为实例的属性￥data的值
    this.$data = config.data

    //设置methods
    for (let key in config.methods) {
      this[key] = config.methods[key].bind(this)
    }

    //设置实例属性binds,数据结构和$data一样
    this.binds = {}

    this.observe()
    // 调用解析器
    this.compile(this.$el)
  }
}
Object.assign(Yuma.prototype, {
  //观察者：观察数据是否发生改变，一旦发生改变就要通知订阅者，订阅者负责更新元素中的数据
  observe() {
    for (let key in this.$data) {
      //设置实例属性binds,数据结构和$data一样
      this.binds[key] = []
      Object.defineProperty(this, key, {
        get() {
          return this.$data[key]
        },
        set(v) {
          this.$data[key] = v
          this.binds[key].forEach(watcher => watcher.update(v))
        }
      })
    }
  },

  //解析器，对模板进行解析(指令，过滤器，模板字符串等)
  compile(el) {
    // 遍历 this.$el 的所有子元素。
    for (let i = 0; i < el.children.length; i++) {
      //要解析的元素节点
      const node = el.children[i];
      this.compile(node)

      //是否需要绑定事件
      if (node.hasAttribute('@click')) {
        //函数名字
        const attrValue = node.getAttribute('@click');
        node.addEventListener('click', this[attrValue].bind())
      }

      if (node.hasAttribute('y-model')) {
        const attrValue = node.getAttribute('y-model');
        //1-设置value值
        node.value = this[attrValue];
        //2-增加事件 
        node.addEventListener('input', (e) => {
          this[attrValue] = e.target.value
        })
        // //3-数据一旦发生更改，node元素下的value值要与数据同步
        // this.binds[attrValue].push(v => {
        //   node.value = v
        // })
        this.binds[attrValue].push(new Watcher(node, 'value'))
      }
      if (node.hasAttribute('y-html')) {
        const attrValue = node.getAttribute('y-html');
        node.innerHTML = this[node.getAttribute('y-html')]
        //数据一旦发生改变，node元素下的innerHTML值要与数据同步
        // this.binds[attrValue].push(v => {
        //   node.innerHTML = v
        // })
        this.binds[attrValue].push(new Watcher(node, 'innerHTML'))
      }
      if (node.hasAttribute('y-text')) {
        const attrValue = node.getAttribute('y-text');
        node.innerText = this[node.getAttribute('y-text')]
        // //数据一旦发生改变，node元素下的innerText值要与数据同步
        // this.binds[attrValue].push(v => {
        //   node.innerText = v
        // })
        this.binds[attrValue].push(new Watcher(node, 'innerText'))
      }
    }
  }
})

function Watcher(node, attr) {
  //当数据发生更改要通知订阅者（制造订阅者）：通知元素下的属性的值要更改
  //元素。属性名=值
  this.node = node,
    this.attr = attr
}

Watcher.prototype.update = function (v) {
  this.node[this.attr] = v
}