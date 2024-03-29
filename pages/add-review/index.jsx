import styles from './review.module.scss'
import { useEffect, useState } from 'react';
import DaoCard from '../../components/DaoCard';
import Nav from '../../components/Nav';
import axios from 'axios';
import MultiWallet from '../../utils/MultiWallet';
import Loader from '../../utils/Loader';
import Head from 'next/head'

//import { client} from "./Connect.jsx"
import { Buffer } from "buffer";

//import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

const alchemyId = 'ckNGqpTIk3SdrCDhZZT0fNjssMKW0fR'
const infuraId = "7cedc93bca594509a5abbaae985320a6"

const getWalletIcon = (name) => {
    if (name == 'MetaMask') {
        return '/metamask.png'
    }
    else if (name == 'Coinbase Wallet') {
        return '/coinbase.png'
    }
    else if (name == 'WalletConnect') {
        return '/wallet-connect.png'
    }
    else {
        return '/wallet.png'
    }
}


import {
    useAccount,
    useConnect,
    useDisconnect,
    useEnsName,
    useSignMessage,
    useNetwork,
    useSendTransaction,
} from 'wagmi';



const API = process.env.API



export default function Index() {

    const [reviewDesc, setreviewDesc] = useState('');
    const [tc, settc] = useState(false);
    const [data, setdata] = useState(null);
    const [dao_list, setdao_list] = useState(null);
    const [loading, setloading] = useState(false)
    const [id, setid] = useState(null);

    const resize = () => {
        let bdy = document.querySelector('body');
        bdy.style.zoom = `${100}%`
        if (window.innerWidth >= 470 && window.innerWidth < 1440) {
            console.log(window.innerWidth)
            bdy.style.zoom = `${((window.innerWidth) / 1440) * 100}%`
        }
    }
    const fluidResize = () => {
        window.addEventListener('resize', resize)
        window.addEventListener('fullscreenchange', resize)
        window.addEventListener('webkitfullscreenchange', resize)
    }
    useEffect(() => {
        resize();
        fluidResize();
    }, [])

    useEffect(() => {
        let cookie = window.getCookie = function (name) {
            var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
            if (match) return match[2];
        }
        let uid = window.location.href.split('=')[1];

        getDetails(cookie, uid)
        if (!window.Buffer) {
            window.Buffer = Buffer;
        }
    }, [])


    const getDetails = async (cookie, uid) => {
        let id = cookie('target')
        setid(id);
        try {
            let res = await axios.get(`${process.env.API}/dao/get-dao-by-id?id=${id}`);
            let user = await axios.get(`${process.env.API}/auth/user?uid=${uid}`)
            let dubplicate_review_res = await axios.get(`${process.env.API}/review/get-review-by-did?dicordId=${user.data.dicordId}&dao_name=${res.data.dao_name}`);
            if (dubplicate_review_res.status == 204) {
                window.location.href = `./redirect/duplicate_review-${res.data.slug}`
            }
            let guild_id = res.data.guild_id;
            if (res.status == 200, user.status == 200) {
                let guild_list = JSON.parse(user.data.guilds).map((ele) => {
                    return ele.id;
                });

                if (guild_list.includes(guild_id)) {
                    setdata(res.data);
                }
                else if (id == '627c85db8ffffe001142935d') {
                    setdata(res.data);
                }
                else {
                    alert("not a member");
                    window.location.href = `./dao/${res.data.slug}`
                }
            }
        }
        catch (er) {
            console.log(er);//
        }

        try {
            const db_res = await axios.get(`${API}/dao/get-dao-list`)
            if (db_res.data) {
                setdao_list(db_res.data.results)
            }
            else {
                alert("network error");
            }
        }
        catch (er) {
            console.log(er);
        }
    }

    useEffect(() => {
        setformData((f) => {
            f['review_desc'] = reviewDesc;
            return { ...f }
        })
    }, [reviewDesc])

    const [formData, setformData] = useState({
        "rating": 0,
        "review_desc": "string",
        "resonate_vibes_rate": 0,
        "onboarding_exp": 0,
        "opinions_matter": 0,
        "great_org_structure": 0,
        "friend_recommend": 0,
        "great_incentives": 0,
    })

    const [public_address, setpublic_address] = useState('');

    useEffect(() => {
        console.log(public_address);
        if (public_address.length > 1 && tc) { postReview(formData, data.dao_name, data.guild_id) }
    }, [public_address])

    const { data: signData, isError, isLoading, isSuccess, signMessage, signMessageAsync } = useSignMessage({
        message: `Sign below to authenticate your Review`,
    })

    const postReview = async (formData, dao_name, guild_id) => {

        let wallet_state = JSON.parse(window.localStorage.getItem('wallet_state'));
        if (!wallet_state) {
            return setconnectWalletModelVisible(true)
        }

        if (wallet_state.chain == 'eth') {
            let res = await signMessageAsync();
            if (!res) {
                return null
            }
            console.log(res);
        } else if (wallet_state.chain == 'sol') {
            const resp = await window.solana.connect();
            let wallet = resp.publicKey.toString()
            const message = `Sign below to authenticate your Review`;
            const encodedMessage = new TextEncoder().encode(message);
            const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
            if (!signedMessage) {
                return null
            }
        } else {
            return null
        }


        let postData = {
            ...formData,
            "dao_name": dao_name,
            "guild_id": guild_id,
            "public_address": wallet_state.wallet_address,
            "chain": wallet_state.chain
        }

        if (id == '6287dcc3f711c412fb9e1074') {
            setloading(true);
            let review_send = await axios.post(`${API}/review/add-review-event`, postData);
            if (review_send.status == 200) {
                console.log(review_send.data);
                let data = { id: review_send.data.db._id, dao_name: review_send.data.db.dao_name, guild_id: review_send.data.db.guild_id, public_address: review_send.data.db.public_address };
                window.location.href = `${API}/review/authorize-review-event?data=${JSON.stringify(data)}`
            }
            else {
                window.location.href = 'https://www.truts.xyz/redirect/duplicate_review'
            }
        }
        else {
            setloading(true);
            let review_send = await axios.post(`${API}/review/add-review`, postData);
            if (review_send.status == 200) {
                console.log(review_send.data);
                let data = { id: review_send.data.db._id, dao_name: review_send.data.db.dao_name, guild_id: review_send.data.db.guild_id, public_address: review_send.data.db.public_address };
                window.location.href = `${API}/review/authorize-review?data=${JSON.stringify(data)}`
            }
            else {
                window.location.href = 'https://www.truts.xyz/redirect/duplicate_review'
            }
        }
    }


    console.log(formData);
    const [connectWalletModelVisible, setconnectWalletModelVisible] = useState(false);

    console.log('add', public_address)

    if (!data) {
        return (
            <Loader />
        )
    }


    if (!dao_list) {
        return (
            <Loader />
        )
    }

    return (
        <>
            <Head>
                <title>Truts</title>
                <meta name="description" content="Discover web3 communities that vibes with you from a list of thousands of communities across different categories (service, investment, media, social) and know all about them" />
                <link rel="icon" href="/favicon.png" />
            </Head>
            {loading && <Loader />}
            <div className={styles.addReview}>
                <Nav openConnectWallet={connectWalletModelVisible} getWalletAddress={(address) => { setpublic_address(address) }} />
                <div>
                    <div className={styles.breadCrum}>
                        <img src="left-arrow.png" alt="" />
                        <span>
                            <p>Add review for</p>
                            <h3>{data.dao_name}</h3>
                        </span>
                    </div>
                    <div className={styles.reviewForm}>

                        <p className={styles.title}>Rate your experience</p>
                        <Rating
                            setrating={(rating) => {
                                setformData((f) => {
                                    f['rating'] = rating;
                                    return { ...f };
                                })
                            }}
                        />
                        <div className={styles.desc}>
                            <p className={styles.title}>Tell us about your experience</p>
                            <textarea
                                value={reviewDesc}
                                onChange={(e) => {
                                    setreviewDesc(e.target.value)
                                }} placeholder='This is where you will write your review. Explain what happened, and leave out offensive words. Keep your feedback honest, helpful and constructive.' name="" id="" cols="30" rows="10"></textarea>
                        </div>
                        <div className={styles.dialCon}>
                            <p className={styles.title}>Please rate the following experiences</p>
                            <div className={styles.col}>
                                <div className={styles.c1}>
                                    <div className={styles.dial}>
                                        <p className={styles.dialTitle}>Do you resonate with the vibes in the DAO community?</p>
                                        <SliderComp
                                            setter={(value) => {
                                                setformData((f) => {
                                                    f['resonate_vibes_rate'] = value;
                                                    return { ...f };
                                                })
                                            }}
                                        />
                                    </div>
                                    <div className={styles.dial}>
                                        <p className={styles.dialTitle}>Do you believe your opinions matter in the DAO community?</p>
                                        <SliderComp
                                            setter={(value) => {
                                                setformData((f) => {
                                                    f['opinions_matter'] = value;
                                                    return { ...f };
                                                })
                                            }}
                                        />
                                    </div>
                                    <div className={styles.dial}>
                                        <p className={styles.dialTitle}>Would you recommed this DAO/community to your friend?</p>
                                        <SliderComp
                                            setter={(value) => {
                                                setformData((f) => {
                                                    f['friend_recommend'] = value;
                                                    return { ...f };
                                                })
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.c2}>
                                    <div className={styles.dial}>
                                        <p className={styles.dialTitle}>How would you rate the DAO’s onboarding experience?</p>
                                        <SliderComp
                                            setter={(value) => {
                                                setformData((f) => {
                                                    f['onboarding_exp'] = value;
                                                    return { ...f };
                                                })
                                            }}
                                        />
                                    </div>
                                    <div className={styles.dial}>
                                        <p className={styles.dialTitle}>Do you think that DAO has great organizational structure?</p>
                                        <SliderComp
                                            setter={(value) => {
                                                setformData((f) => {
                                                    f['great_org_structure'] = value;
                                                    return { ...f };
                                                })
                                            }}
                                        />
                                    </div>
                                    <div className={styles.dial}>
                                        <p className={styles.dialTitle}>Do you think there are great incentives for DAO members?</p>
                                        <SliderComp
                                            setter={(value) => {
                                                setformData((f) => {
                                                    f['great_incentives'] = value;
                                                    return { ...f };
                                                })
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.tc}>
                                <input value={tc} onChange={() => {
                                    settc(!tc);
                                }} className={styles.checkbox} type="checkbox" />
                                <p>I confirm this review is about my own genuine experience. I am eligible to leave this review, and have not been offered any incentive or payment to leave a review for this community.</p>
                            </div>
                            <button className={styles.btnFilled} onClick={() => {
                                if (reviewDesc.length < 12) { return (alert("Review Not Posted: Please tell us your experience and review in more than 5 words.")); }
                                (formData.rating > 0) ? (tc ? postReview(formData, data.dao_name, data.guild_id) : alert("Please check the Terms and Conditions.")) : alert("Please add Rating");
                            }} >Post the review</button>
                        </div>
                    </div>
                </div>

                <div className={styles.rightSidebar}>
                    <h3>Recent reviews</h3>
                    <div className={styles.scrollBar}>
                        <div className={styles.reviewCard + ' ' + styles.r1}>
                            <p>SuperteamDAO is a crazy community, being build by crazy people, helping Web3 flourish alll around, making solana a global enabler for web3. Super cool floks backing super cool projects. Definitely community to be part off. 🚀🚀</p>
                            <div className={styles.profile}>
                                <img className={styles.commaFloat} src="/comma-float.png" alt="" />
                                <img style={{ gridArea: 'a' }} className={styles.profileImg} src="/hero-bg.jpg" alt="" />
                                <p>0x...f4b1</p>
                                <Starrating rating={5} />
                            </div>
                        </div>
                        <div className={styles.reviewCard + ' ' + styles.r1}>
                            <p>Yooo Memers, The OG Lords of memes at one place. Crazy community for crazy people. Find your vibe here at one place. Post memes and engage and share it with memers... Definitely a place to be for the🚀 folks..</p>
                            <div className={styles.profile}>
                                <img className={styles.commaFloat} src="/comma-float.png" alt="" />
                                <img style={{ gridArea: 'a' }} className={styles.profileImg} src="/hero-bg.jpg" alt="" />
                                <p>0x...e631</p>
                                <Starrating rating={5} />
                            </div>
                        </div>
                        <div className={styles.reviewCard + ' ' + styles.r1}>
                            <p>Superteam is a community that helps and uplifts all it`s members and solana ecosystem. They help you grow both financially and socially. It`s not a DAO it`s a place where you make friends for life. The best part is there`s opportunity for people from all the areas be it dev, design, marketing, content or memes. WAGMI.</p>
                            <div className={styles.profile}>
                                <img className={styles.commaFloat} src="/comma-float.png" alt="" />
                                <img style={{ gridArea: 'a' }} className={styles.profileImg} src="/hero-bg.jpg" alt="" />
                                <p>0x...c130</p>
                                <Starrating rating={5} />
                            </div>
                        </div>
                        <div className={styles.reviewCard + ' ' + styles.r1}>
                            <p>Superteam DAO is a super awesome community. Superteam folks are always buidling cool stuff for the Solana ecosystem. Everyone contribute their absolute best in every way possible. As a part of the community, I can guarantee a great potential to learn and explore the web3 ecosystem. </p>
                            <div className={styles.profile}>
                                <img className={styles.commaFloat} src="/comma-float.png" alt="" />
                                <img style={{ gridArea: 'a' }} className={styles.profileImg} src="/hero-bg.jpg" alt="" />
                                <p>0x...z707</p>
                                <Starrating rating={5} />
                            </div>
                        </div>
                        <div className={styles.reviewCard + ' ' + styles.r1}>
                            <p>Superteam is a super high-quality DAO. Nobody ever feels that they are the smartest in the room, which clearly means the Members are in the right place!</p>
                            <div className={styles.profile}>
                                <img className={styles.commaFloat} src="/comma-float.png" alt="" />
                                <img style={{ gridArea: 'a' }} className={styles.profileImg} src="/hero-bg.jpg" alt="" />
                                <p>0x...fAce</p>
                                <Starrating rating={5} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className={styles.footer}>
                <h3>Other similar DAOs</h3>
                <div className={styles.daoList}>
                    {
                        dao_list.map((ele, idx) => {
                            if (idx < ((window.outerWidth < 428) ? 3 : 4)) {
                                return <DaoCard data={ele} key={idx + "daolist"} />
                            }
                        })
                    }

                </div>
            </div>
        </>
    )
}

function Starrating({ rating }) {
    return (
        <div className={styles.ratingComp}>
            {
                [1, 2, 3, 4, 5].map((ele) => {
                    let img_src = "/star-blank.png"
                    if (ele <= rating) {
                        img_src = "/star-filled.png"
                    }
                    return (
                        <img key={"i" + ele} src={img_src} alt=""
                        />
                    )
                })
            }
        </div>
    )
}


function SliderComp({ setter }) {
    const [sliderValue, setsliderValue] = useState(50);

    useEffect(() => {
        setter(sliderValue);
    }, [sliderValue])

    return (
        <div className={styles.slider}>
            <span className={styles.sliderComp}>
                <div
                    className={styles.sliderBarBg} />
                <div
                    style={{ width: `${Math.min(sliderValue, 97)}%` }}
                    className={styles.sliderBar} />
                <input type="range"
                    min="0" max="100" step="1"
                    value={sliderValue}
                    onChange={(e) => {
                        setsliderValue(parseInt(e.target.value));
                    }}
                />
            </span>
            <p className={styles.value} >{sliderValue}%</p>
        </div>
    )
}

function Rating({ setrating }) {
    const [rating, setRating] = useState(0);
    const [saveRating, setSaveRating] = useState(0);
    const [hover, sethover] = useState(false);

    useEffect(() => {
        setrating(rating);
    }, [rating])

    return (
        <div className={styles.ratingComp}>
            {
                [1, 2, 3, 4, 5].map((ele) => {
                    let img_src = '/star-blank.png';
                    if (ele <= rating) {
                        img_src = '/star-filled.png';
                    }
                    return (
                        <img
                            key={"st" + ele}
                            src={img_src} alt=""
                            onMouseEnter={(e) => {
                                setRating(ele)
                            }}
                            onClick={() => {
                                setSaveRating(ele);
                            }}
                            onMouseLeave={() => {
                                if (rating != saveRating) {
                                    setRating(saveRating);
                                }
                            }}
                        />
                    )
                })
            }
        </div>
    )
}

//Post review






/* 
question format

1 4
2 5
3 6

*/
