const homeComponents = []
const authComponents = []
const pageComponents = []

var token = null

function useBool(v) {
	const [val, setVal] = useState(v)

	const valTrue = useCallback(() => !val && setVal(true), [val])
	const valFalse = useCallback(() => val && setVal(false), [val])

	return [val, valTrue, valFalse]
}

function useForm() {
	const [formData, setFormData] = useState({})

	onInput = fieldName => {
		return e => {
			var f = {...formData}
			f[fieldName] = e.target.value
			setFormData(f)
		}
	}

	return [formData, onInput, setFormData]
}

function useAPI() {
	const [isMounted, setIsMounted] = useState(true)

	useEffect(() => {
		return () => setIsMounted(false)
	})

	async function api(path, data, t) {
		t = t || token
		const res = await fetch(`{{base}}${path}`, {
			method: "post",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				token: t,
				...data,
			}),
		})
		if (!res.ok) {
			return {
				content: null,
				error: "Network error",
				isMounted,
			}
		}
		const content = await res.json()
		if (content.error) {
			return {
				content: null,
				error: content.error,
				isMounted,
			}
		}
		return {
			content: content,
			error: null,
			isMounted,
		}
	}

	return api
}


function Client() {
	return html`
		<${Wrapper}>
			<${MultapClient} />
		<//>
	`
}

function Wrapper(props) {
	return html`
		<section class="section is-fullheight has-centered has-bg-light">
			${props.children}
		</section>
	`
}

function MultapClient() {
	const [user, setUser] = useState(null)
	const [roomId, setRoomId] = useState(null)
	const api = useAPI()

	const page = pageComponents.map(comp => html`<${comp}/>`)

	const onLogin = async t => {
		const { content, error } = await api("auth/token", {}, t)
		if (error) {
			alert(error)
			return
		}
		token = t
		setUser(content.user)
		route("{{base}}rooms", true)
	}

	onLogout = () => {
		token = null
		setUser(null)
	}

	const onJoinRoom = (room) => {
		setRoom(room)
	}

	onLeaveRoom = (room) => {
		setRoom(null)
	}

	const handleRoute = (e) => {
		switch (e.url) {
			case '{{base}}':
				if (user) route("{{base}}rooms", true)
				break
			case "{{base}}rooms":
				if (!user) route("{{base}}", true)
				if (roomId) route("{{base}}room", true)
				break
			case "{{base}}room":
				if (!user) route("{{base}}", true)
				if (!roomId) route("{{base}}rooms", true)
				break
		}
	}

	return html`
		<div class="container">
			<${Router} onChange=${handleRoute}>
				<${HomePage} onLogin=${onLogin} path="/" />
				<${RoomsPage} onJoinRoom=${onJoinRoom} path="/rooms" />
				<${RoomPage} path="/room/:id" />
				${pageComponents}
			<//>
			<${Footer} />
		</div>
	`
}

function HomePage(props) {
	const auth = authComponents.map(comp => html`<${comp} onLogin=${props.onLogin} />`)
	const home = homeComponents.map(comp => html`<${comp} />`)

	return html`
		<div class="columns is-desktop">
			<div class="column is-8-desktop">
				${home}
			</div>
			<div class="column is-4-desktop">
				${auth}
			</div>
		</div>
	`
}

function HomeInfo() {
	return html`
		<div class="homeinfo">
			<p class="homeinfo-title title"> {{name}} </p>
			<p> {{{descHTML}}} </p>
		</div>
	`
}

function Footer() {
	return html`
		<p class="has-text-small has-text-centered">
			Powered by <a href="https://github.com/yjp20/multap">Multap</a>
		</p>
	`
}

function RoomsPage() {
	return html`
		<div class="card">
			<div class="card-header">
				<p> {{name}} - Rooms </p>
			</div>
			<div class="card-body">
				<${RoomList} />
				<${RoomsControls} />
			</div>
		</div>
	`
}

function RoomList() {
	const [rooms, setRooms] = useState([])
	const [isLoaded, isLoadedTrue, isLoadedFalse] = useBool(false)
	const api = useAPI()

	getRooms = async () => {
		const { content, error } = await api("rooms/get")
		if (error) {
			alert(error, "Retrying in 10 seconds")
			return
		}
		setRooms(content.rooms)
		isLoadedTrue()
		return
	}

	useEffect(() => {
		getRooms()
		const timer = setInterval(getRooms, 10000) 
		return () => clearTimeout(timer)
	}, [])

	var roomItems = rooms.map(room => html`<${RoomItem} room=${room}/>`)

	return html`
		<div class="roomlist">
			<div class="columns">
				<div class="column is-narrow">
					<button class="button" onClick=${getRooms}>↻</button>
				</div>
				<div class="column">
					<input type="text" placeholder="Search..." />
				</div>
			</div>
			<div class="roomlist-container-header">
				<div class="columns">
					<div class="column is-4 is-offset-1"> Name </div>
					<div class="column is-4"> Host </div>
					<div class="column is-2 has-text-right"> # </div>
				</div>
			</div>
			<div class="roomlist-container">
				${roomItems}
				${isLoaded && roomItems.length == 0 && html`
					<div class="roomlist-item roomlist-item_norooms">
						No rooms
					</div>
				`}
				${!isLoaded && html`<div class="loader centered"></div> `}
			</div>
		</div>
	`
}

function RoomItem(props) {
	const [isOpen, isOpenTrue, isOpenFalse] = useBool(false)

	return html`
		<div class="roomlist-item" onClick=${isOpenTrue}>
			<div class="columns">
				<div class="column is-1 roomlist-indicators"><${RoomStatusIndicator} status=${props.room.status}/></div>
				<div class="column is-4 roomlist-name"> ${props.room.name} </div>
				<div class="column is-4 roomlist-host"> ${props.room.host.nick} </div>
				<div class="column is-2 roomlist-count has-text-right"> ${props.room.num} / ${props.room.max} </div>
			</div>
		</div>

		${isOpen && html`
			<${Modal} onClose=${isOpenFalse}>
				<${JoinRoomModal} roomId=${props.room.id}/>
			<//>
		`}
	`
}

function JoinRoomModal({roomId}) {
	const [isLoaded, isLoadedTrue, isLoadedFalse] = useBool(false)
	const [roomPreview, setRoomPreview] = useState(null)
	const [formData, onInput] = useForm()
	const api = useAPI()

	getRoomPreview = async () => {
		const { content, error } = await api("room/get", {
			id: roomId,
		})
		if (error) {
			alert(error)
			return
		}
		setRoomPreview(content.roomPreview)
		isLoadedTrue()
		console.log("hello")
	}

	onClick = async () => {
		const { content, error } = await api("room/join", {
			id: roomId,
			password: formData.password,
		})
		if (error) {
			alert(error)
			return
		}
	}

	useEffect(() => {
		getRoomPreview()
		const timer = setInterval(getRoomPreview, 10000)
		return () => clearInterval(timer)
	}, [])

	passwordField = {
		"viewname": "Password",
		"name": "password",
		"type": "password",
	}

	return html`
		${!isLoaded && html`<div class="field"><div class="loader centered"></div></div>`}
		${isLoaded && html`
			${roomPreview.status.includes("locked") && html`<${FormComponent} onInput=${onInput("password")} data=${passwordField}/>`}
		`}
		<div class="field">
			<button class="button is-fullwidth" onClick=${onClick}> Join Room </button>
		</div>
	`
}

function RoomStatusIndicator(props) {
	var status = props.status
	var indicators = {
		"waiting": html`<span class="roomlist-indicator roomlist-indicator-waiting"></span>`,
		"playing": html`<span class="roomlist-indicator roomlist-indicator-playing"></span>`,
		"locked": html`<span class="roomlist-indicator">🔒</span>`,
	}
	var components = []
	status.forEach(e => components.push(indicators[e]))
	return components
}

function RoomsControls(props) {
	return html`
		<div class="columns">
			<div class="column is-narrow">
				<${NewRoomButton} />
			</div>
			<div class="column is-narrow">
				<${FindRoomButton} />
			</div>
		</div>
	`
}

function NewRoomButton() {
	const [isOpen, setIsOpen] = useState(false)

	return html`
		<button class="button" onClick=${() => setIsOpen(true)}>New Room</button>
		${isOpen && html`
			<${Modal} onClose=${() => setIsOpen(false)}>
				<${NewRoomModal} />
			<//>
		`}
	`
}

function NewRoomModal() {
	const [isLoaded, isLoadedTrue, isLoadedFalse] = useBool(false)
	const [roomOptions, setRoomOptions] = useState({})
	const [formData, onInput] = useForm()
	const api = useAPI()

	onLoad = async () => {
		if (isLoaded) return
		var { content, error, isMounted } = await api("rooms/options")
		if (error) {
			alert(error)
			return
		}
		if (isMounted) {
			isLoadedTrue()
			setRoomOptions(content.roomOptions)
		}
	}

	onClick = async () => {
		var { content, error } = await api("rooms/new", formData)
		if (error) {
			alert(error)
			return
		}
		console.log(content)
	}

	useEffect(onLoad, [])

	var formComponents = []

	if (isLoaded) {
		roomOptions.forEach((e) => {
			formComponents.push(html`<${FormComponent} data=${e} onInput=${onInput(e.name)}/>`)
		})
	}

	return html`
		${!isLoaded && html`<div class="field"><div class="loader centered"></div></div>`}
		${isLoaded && formComponents}
		<div class="field">
			<button class="button is-fullwidth" onClick=${onClick}> New Room </button>
		</div>
	`
}

function FindRoomButton() {
	return html`
		<button class="button">Find Room</button>
	`
}

function RoomPage() {
	useState(null)

	return html`
		<div class="card">
			<div class="card-header">
				<p> {{name}} - Room </p>
			</div>
			<div class="card-body">
				${!isLoaded && html`
					<div class="flex-column has-centered">
						<div class="loader"></div>
					</div>
				`}
				${isLoaded}
			</div>
		</div>
	`
}

// etc.

function Modal(props) {
	return createPortal(html`
		<div class="modal">
			<div class="modal-item">
				<div class="card">
					<div class="card-header">
						<button class="button is-red" onClick=${props.onClose}> X </button>
					</div>
					<div class="card-body">
						${props.children}
					</div>
				</div>
			</div>
		</div>
	`, document.body)
}

function FormComponent(props) {
	var d = props.data

	var viewname = d.viewname || d.name || "Form Field"
	var name = d.name || "Form Field"
	var placeholder = d.placeholder || d.name || ""
	var type = d.type
	var max = d.max
	var hasLabel = d.hasLabel === undefined ? true : d.hasLabel

	var comps = {
		"text": html`<input type="text" class="input" maxlength=${max} onInput=${props.onInput} placeholder=${placeholder}/>`,
		"password": html`<input type="password" class="input" maxlength=${max} onInput=${props.onInput} placeholder=${placeholder}/>`,
	}

	var sub = comps[type]

	return html`
		<div class="field">
			${hasLabel && html`<label class="label"> ${viewname} </label>`}
			${sub}
		</div>
	`
}

homeComponents.push(HomeInfo)
